import '../css/game';

import { ViewManager, VIEW, IView } from "./ViewManager";
import { Services } from "./Services";
import { IServicesGame } from "./serviceModel/IServicesGame";
import { IServicesCard } from './serviceModel/IServicesCard';
import { emptyDiv, findAncestor } from './Utilts';
import { IServicesGameState } from './serviceModel/IServicesGameState';

export class GameController implements IView {
    private game:IServicesGame;
    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('gameHome').addEventListener('click', e=> {
            viewManager.open(VIEW.USER_SCREEN);
        }); 
        document.getElementById('gameMyHand').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                const card = findAncestor(e.target as HTMLElement, 'gameCard');
                if(card) {
                    this.playCard(card);
                }
            }
        });
        document.getElementById('gameTradeRow').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                const card = findAncestor(e.target as HTMLElement, 'gameCard');
                if(card && card.classList.contains('gameCardClickable')) {
                    this.buyCard(card);
                }
            }
        });
    }

    private buyCard(cardElement:HTMLElement):void {
        for(let i = 0; i < this.game.shared_data.tradeRow.length; ++i) {
            const c = this.game.shared_data.tradeRow[i];
            if(c.id === cardElement.dataset.id) {
                //take card off top of draw pile and put in trade row
                this.game.shared_data.tradeRow.splice(i, 1);
                //TODO check for no cards left
                const newCard = this.game.shared_data.drawPile.shift();
                this.game.shared_data.tradeRow.push(newCard);

                //make non clickable
                cardElement.classList.remove('gameCardClickable');

                //TODO only effect model, then call refresh UI. Dont try and mess with UI at all. that way lies madness. Do that here and in playCard
                
                //put in discard pile
                this.updateCurrentStock(c.trade);
                document.getElementById('gameMyDiscard').appendChild(cardElement);
                break;
            }
        }
    }

    private playCard(cardElement:HTMLElement):void {
        const userdata = this.game.user1 === this.services.currentUser ? this.game.user1_data : this.game.user2_data;
        for(let c of userdata.hand) {
            if(c.id === cardElement.dataset.id) {
                cardElement.classList.remove('gameCardClickable');
                this.updateCurrentStock(c.trade, c.attack, c.authority);
                document.getElementById('gamePlayAreaCards').appendChild(cardElement);
                break;
            }
        }
    }

    private resetCurrentStock() {
        document.getElementById('gamePlayTrade').innerHTML = "0";
        document.getElementById('gamePlayAttack').innerHTML = "0";
        document.getElementById('gamePlayAuthority').innerHTML = "0";
    }

    private updateCurrentStock(trade:number, attack:number, authority: number): void {
        let currentTrade = parseInt(document.getElementById('gamePlayTrade').innerHTML);
        let currentAttack = parseInt(document.getElementById('gamePlayAttack').innerHTML);
        let currentAuthority = parseInt(document.getElementById('gamePlayAuthority').innerHTML);

        currentTrade += trade;
        currentAttack += attack;
        currentAuthority += authority;

        document.getElementById('gamePlayTrade').innerHTML = currentTrade.toString();
        document.getElementById('gamePlayAttack').innerHTML = currentAttack.toString();
        document.getElementById('gamePlayAuthority').innerHTML = currentAuthority.toString();

        //go through the trade deck, highlight whats available
        for(let c of this.game.shared_data.tradeRow) {
            const cardElement = document.getElementById('gameTradeRow').querySelector('[data-id="' + c.id + '"]');
            if(c.cost <= currentTrade) {
                cardElement.classList.add('gameCardClickable');
            }
            else {
                cardElement.classList.remove('gameCardClickable');
            }
        }
    }

    open(game:IServicesGame):void {
        if(!game) {
            throw {
                error: 'No game provided'
            };
        }
        this.game = game;
        this.resetCurrentStock();
        this.refreshUI();
    }
    
    close():void {

    }

    type(): VIEW {
        return VIEW.GAME;
    }

    element(): HTMLDivElement {
        return document.getElementById('gameView') as HTMLDivElement;
    }

    isMyTurn() {
        if(!this.game) {
            return false;
        }

        if(this.game.gamestate == IServicesGameState.USER1_TURN && this.game.user1 == this.services.currentUser) {
            return true;
        }
        else if(this.game.gamestate == IServicesGameState.USER2_TURN && this.game.user2 == this.services.currentUser) {
            return true;
        }
        return false;
    }

    refreshUI(): void {
        if(!this.game) {
            return;
        }
        if(!this.services.currentUser) {
            return;
        }
        emptyDiv(document.getElementById('gameDrawPile'));
        emptyDiv(document.getElementById('gameHalflings'));
        emptyDiv(document.getElementById('gameTradeRow'));
        emptyDiv(document.getElementById('gameMyHand'));
        emptyDiv(document.getElementById('gameMyDeck'));

        //go top to bottom
        //TODO do as diff
        //TODO draw their space

        if(this.isMyTurn()) {
            document.getElementById('gameMyArea').classList.add('gameMyTurn');
        }
        else {
            document.getElementById('gameMyArea').classList.remove('gameMyTurn');
        }

        //draw shared space
        if(this.game.shared_data.halflings.length > 0) {
            document.getElementById('gameHalflings').appendChild(this.createFaceUpCard(this.game.shared_data.halflings[0]));
        }
        const gameDrawPile = this.drawDeck(this.game.shared_data.drawPile);
        if(gameDrawPile) {
            document.getElementById('gameDrawPile').appendChild(gameDrawPile);
        }
        for(let i = 0; i < this.game.shared_data.tradeRow.length; ++i) {
            document.getElementById('gameTradeRow').appendChild(this.createFaceUpCard(this.game.shared_data.tradeRow[i]));
        }

        //draw my space
        const myData = this.game.user1 === this.services.currentUser ? this.game.user1_data : this.game.user2_data;
        for(let i = 0; i < myData.hand.length; ++i) {
            const cardElement = this.createFaceUpCard(myData.hand[i]);
            cardElement.classList.add('gameCardClickable');
            document.getElementById('gameMyHand').appendChild(cardElement);
        }
        
        const myDrawPile = this.drawDeck(myData.drawPile);
        if(myDrawPile) {
            document.getElementById('gameMyDeck').appendChild(myDrawPile);
        }
    }

    private drawDeck(cards: IServicesCard[]):HTMLDivElement {
        if(cards.length > 0) {
            const div = document.createElement('div');
            div.classList.add('gameCard');
            div.classList.add('gameCardBack');
            div.classList.add('gameCardDeck');

            const s = document.createElement('span');
            s.classList.add('gameDeckLeft')
            s.innerHTML = cards.length.toString();
            div.appendChild(s);
            return div;
        }
        return null;
    }

    private createFaceUpCard(card: IServicesCard):HTMLDivElement {
        const div = document.createElement('div');
        div.classList.add('gameCard');
        div.dataset.id = card.id;

        const c = document.createElement('p');
        c.innerHTML = 'Cost: ' + card.cost;
        const a = document.createElement('p');
        a.innerHTML = 'Attack: ' + card.attack;
        const t = document.createElement('p');
        t.innerHTML = 'Trade: ' + card.trade;
        const auth = document.createElement('p');
        auth.innerHTML = 'Authority: ' + card.authority;
        div.appendChild(c);
        div.appendChild(a);
        div.appendChild(t);
        div.appendChild(auth);
        return div;
    }
}