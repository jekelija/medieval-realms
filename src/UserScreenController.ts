import '../css/userScreen';

import * as log from 'loglevel';

import '../css/userScreen';

import { Services } from './Services';
import { IView, VIEW, ViewManager } from './ViewManager';
import { IServicesGame } from './serviceModel/IServicesGame';
import { IServicesGameState } from './serviceModel/IServicesGameState';

export class UserScreenController implements IView {
    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('userScreenCreateGame').addEventListener('click', e=> {
            this.createGame();
        });
    }

    open():void {
        document.getElementById('userScreenUsername').innerHTML = this.services.currentUser;
        this.getGames();
    }
    
    close():void {

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
            user2: ''
        });
    }

    private async getGames(): Promise<void> {
        const games = await this.services.getGames();

        for(let g of games) {
            this.buildGameHtml(g);
        }
    }

    private buildGameHtml(game: IServicesGame): void {
        const parent = document.getElementById('userGames');
        const div = document.createElement('div');
        div.classList.add('userScreenGame');

        const gameId = document.createElement('p');
        gameId.innerHTML = game.gameid;

        const gameState = document.createElement('p');
        switch(game.gamestate) {
            case IServicesGameState.CREATED: 
                gameState.innerHTML = 'Waiting for other user';
                break;
            case IServicesGameState.DRAW: 
                gameState.innerHTML = 'Draw';
                break;
            case IServicesGameState.USER1_TURN: 
                gameState.innerHTML = game.user1 == this.services.currentUser ? 'Your turn' : 'Their turn';
                if(game.user1 == this.services.currentUser) {
                    div.classList.add('yourTurn');
                }
                break;
            case IServicesGameState.USER2_TURN: 
                gameState.innerHTML = game.user2 == this.services.currentUser ? 'Your turn' : 'Their turn';
                if(game.user2 == this.services.currentUser) {
                    div.classList.add('yourTurn');
                }
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

        parent.appendChild(div);
    }

    type(): VIEW {
        return VIEW.USER_SCREEN;
    }

    element(): HTMLDivElement {
        return document.getElementById('userScreenView') as HTMLDivElement;
    }

}