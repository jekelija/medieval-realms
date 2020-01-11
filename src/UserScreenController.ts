import '../css/userScreen';

import * as log from 'loglevel';

import '../css/userScreen';

import { Services } from './Services';
import { IView, VIEW, ViewManager } from './ViewManager';
import { IServicesGame } from './serviceModel/IServicesGame';
import { IServicesGameState } from './serviceModel/IServicesGameState';
import { findAncestor, emptyDiv } from './Utilts';

export class UserScreenController implements IView {
    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('userScreenCreateGame').addEventListener('click', e=> {
            this.createGame();
        });
        document.getElementById('userScreenJoinGame').addEventListener('click', e=> {
            this.joinGame((document.getElementById('userScreenJoinGameInput') as HTMLInputElement).value);
        });
        document.getElementById('userGames').addEventListener('click', e=> {
            const clickedGame = findAncestor(e.target as HTMLElement, 'userScreenGame');
            if(clickedGame && clickedGame.classList.contains('joinable')) {
                this.enterGame(clickedGame.dataset.gameId);
            }
        });
    }

    open():void {
        document.getElementById('userScreenUsername').innerHTML = this.services.currentUser;
        this.getGames();
    }
    
    close():void {

    }

    type(): VIEW {
        return VIEW.USER_SCREEN;
    }

    element(): HTMLDivElement {
        return document.getElementById('userScreenView') as HTMLDivElement;
    }

    private async enterGame(gameId: string): Promise<void> {
        const joinGameError = document.getElementById('userScreenJoinGameError');
        joinGameError.innerHTML = '';
        try {
            const game = await this.services.getGame(gameId);
            this.viewManager.open(VIEW.GAME, game);
        } catch(err) {
            joinGameError.innerHTML = err.error;
        }
    }

    private async joinGame(gameId: string): Promise<void> {
        log.debug('joining game');
        const joinGameError = document.getElementById('userScreenJoinGameError');
        joinGameError.innerHTML = '';
        (document.getElementById('userScreenJoinGame') as HTMLButtonElement).disabled = true;
        try {
            const game = await this.services.joinGame(gameId);
            this.buildGameHtml(game);
            this.viewManager.open(VIEW.GAME, game);
        } catch(err) {
            joinGameError.innerHTML = err.error;
        }
        (document.getElementById('userScreenJoinGame') as HTMLButtonElement).disabled = false;
        
    }

    private async createGame(): Promise<void> {
        log.debug('Creating game');
        (document.getElementById('userScreenCreateGame') as HTMLButtonElement).disabled = true;
        const gameId = await this.services.createGame();
        (document.getElementById('userScreenCreateGame') as HTMLButtonElement).disabled = false;
        this.buildGameHtml({
            gamestate: 0,
            gameid: gameId,
            user1: this.services.currentUser,
            user2: '',
            user1_data : null, //dont care about any data yet
            user2_data : null,
            shared_data : null
        });
    }

    private async getGames(): Promise<void> {
        const games = await this.services.getGames();
        const parent = document.getElementById('userGames');
        emptyDiv(parent);
        for(let g of games) {
            this.buildGameHtml(g);
        }
    }

    private buildGameHtml(game: IServicesGame): void {
        const parent = document.getElementById('userGames');
        const div = document.createElement('div');
        div.classList.add('userScreenGame');
        div.dataset.gameId = game.gameid;

        const gameId = document.createElement('p');
        gameId.innerHTML = game.gameid;

        const gameState = document.createElement('p');
        const against = document.createElement('p');
        against.innerHTML = 'Playing: ' + game.user1 == this.services.currentUser ? game.user2 : game.user1;

        switch(game.gamestate) {
            case IServicesGameState.CREATED: 
                gameState.innerHTML = 'Waiting for other user';
                against.innerHTML = '';
                break;
            case IServicesGameState.DRAW: 
                gameState.innerHTML = 'Draw';
                break;
            case IServicesGameState.USER1_TURN: 
                gameState.innerHTML = game.user1 == this.services.currentUser ? 'Your turn' : 'Their turn';
                div.classList.add('joinable');
                break;
            case IServicesGameState.USER2_TURN: 
                gameState.innerHTML = game.user2 == this.services.currentUser ? 'Your turn' : 'Their turn';
                div.classList.add('joinable');
                break;
            case IServicesGameState.USER1_WON: 
                gameState.innerHTML = game.user1 == this.services.currentUser ? 'You won' : 'You lost';
                break;
            case IServicesGameState.USER2_WON: 
                gameState.innerHTML = game.user2 == this.services.currentUser ? 'You won' : 'You lost';
                break;
        }

        div.appendChild(gameId);
        div.appendChild(gameState);
        div.appendChild(against);

        parent.appendChild(div);
    }

}