import '../css/game';

import { ViewManager, VIEW, IView } from "./ViewManager";
import { Services } from "./Services";
import { IServicesGame } from "./serviceModel/IServicesGame";
import { IServicesCard } from './serviceModel/IServicesCard';
import { emptyDiv, findAncestor } from './Utilts';
import { IServicesGameState } from './serviceModel/IServicesGameState';
import { TurnInfo } from './model/turninfo';
import { IServicesTurnInfo } from './serviceModel/IServicesTurnHistory';
import { IServicesPlayerState } from './serviceModel/IServicesPlayerState';

export class GameController implements IView {
    private game:IServicesGame;
    private currentTurn:TurnInfo = null;

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
        document.getElementById('gameAttack').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                this.attack();
            }
        });
        document.getElementById('gameEndTurn').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                //make it not my turn immediately so no double click on button
                this.game.user1 == this.services.currentUser ? this.game.gamestate = IServicesGameState.USER2_TURN : this.game.gamestate = IServicesGameState.USER1_TURN;
                this.endTurn();
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

    private endTurn(): void {
        const myData = this.getUserData();
        myData.health += this.currentTurn.authority;

        // save off turn info, then clear local one before refreshing UI
        const servicesTurnInfo: IServicesTurnInfo = {
            trade: this.currentTurn.totalTrade,
            attack: this.currentTurn.totalAttack,
            authority: this.currentTurn.authority,
            cardsAcquired: this.currentTurn.cardsAcquired.map(c=>c.name),
            cardsTrashed: this.currentTurn.cardsTrashed.map(c=>c.name),
            cardsPlayed: this.currentTurn.cardsPlayed.map(c=>c.name)
        };

        //take all played cards and put in discard
        this.getUserData().discardPile = this.getUserData().discardPile.concat(this.currentTurn.cardsPlayed);
        this.getUserData().discardPile = this.getUserData().discardPile.concat(this.getUserData().hand);

        if(!this.game.shared_data.turnHistory) {
            this.game.shared_data.turnHistory = [];
        }
        this.game.shared_data.turnHistory.push(servicesTurnInfo);

        // send up to services, add refresh buttons so other user can see
        this.services.endTurn(this.game.gameid, this.game);

        //after sending to services (to ensure that turn info was stored ), clear out turn
        //refersh this.currentGame from service response
        this.currentTurn = null;
        this.refreshUI();
    }

    private buyCard(cardElement:HTMLElement):void {
        for(let i = 0; i < this.game.shared_data.tradeRow.length; ++i) {
            const c = this.game.shared_data.tradeRow[i];
            if(c.id === cardElement.dataset.id) {
                //take card off top of draw pile and put in trade row
                this.game.shared_data.tradeRow.splice(i, 1);
                // check for no cards left
                if(this.game.shared_data.drawPile.length > 0) {
                    const newCard = this.game.shared_data.drawPile.shift();
                    this.game.shared_data.tradeRow.push(newCard);
                }
                //add to discard pile
                const userData = this.getUserData();
                userData.discardPile.push(c);
                
                //decrease trade
                this.currentTurn.totalTrade += c.cost;
                this.currentTurn.trade -= c.cost;
                this.currentTurn.cardsAcquired.push(c);

                this.refreshUI();
                break;
            }
        }
    }

    private attack():void {
        const otherData = this.getOtherUserData();
        otherData.health -= this.currentTurn.attack;
        this.currentTurn.totalAttack += this.currentTurn.attack;
        this.currentTurn.attack = 0;
        this.refreshUI();
    }

    private playCard(cardElement:HTMLElement):void {
        const userdata = this.game.user1 === this.services.currentUser ? this.game.user1_data : this.game.user2_data;
        for(let i = 0; i < userdata.hand.length; ++i) {
            const c = userdata.hand[i];
            if(c.id === cardElement.dataset.id) {
                userdata.hand.splice(i, 1);
                this.currentTurn.cardsPlayed.push(c);
                this.updateCurrentStock(c.trade, c.attack, c.authority);
                break;
            }
        }
    }

    private updateCurrentStock(trade:number, attack:number, authority: number): void {
        this.currentTurn.trade += trade;
        this.currentTurn.attack += attack;
        this.currentTurn.authority += authority;
        
        this.refreshUI();
    }


    open(game:IServicesGame):void {
        if(!game) {
            throw {
                error: 'No game provided'
            };
        }
        this.game = game;
        if(this.isMyTurn()) {
            this.currentTurn = new TurnInfo();
        }
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

    isMyTurn():boolean {
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

    getUserData(): IServicesPlayerState {
        if(!this.game) {
            return null;
        }
        return this.game.user1 == this.services.currentUser ? this.game.user1_data : this.game.user2_data;
    }

    getOtherUserData(): IServicesPlayerState {
        if(!this.game) {
            return null;
        }
        return this.game.user1 != this.services.currentUser ? this.game.user1_data : this.game.user2_data;
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
        emptyDiv(document.getElementById('gameMyDiscard'));
        emptyDiv(document.getElementById('gameMyDeck'));
        emptyDiv(document.getElementById('gamePlayAreaCards'));
        emptyDiv(document.getElementById('gameOtherDeck'));
        emptyDiv(document.getElementById('gameOtherDiscard'));
        emptyDiv(document.getElementById('gameOtherHand'));

        
        //go top to bottom
        //TODO do as diff

        //other players
        const otherData = this.getOtherUserData();
        for(let i = 0; i < otherData.hand.length; ++i) {
            const cardElement = this.createFaceDownCard(otherData.hand[i]);
            document.getElementById('gameOtherHand').appendChild(cardElement);
        }

        const otherDiscardPile = this.drawDiscard(otherData.discardPile);
        if(otherDiscardPile) {
            document.getElementById('gameOtherDiscard').appendChild(otherDiscardPile);
        }
        
        const otherDrawPile = this.drawDeck(otherData.drawPile, otherData.health);
        if(otherDrawPile) {
            document.getElementById('gameOtherDeck').appendChild(otherDrawPile);
        }

        const myTurn = this.isMyTurn();
        if(myTurn) {
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

        //if its my turn show my current turn in the game play area
        let turnInfo: IServicesTurnInfo | TurnInfo;
        if(myTurn) {
            turnInfo = this.currentTurn;
        }
        //otherwise, show the turn info from shared state
        else if(this.game.shared_data.turnHistory.length > 0){
            turnInfo = this.game.shared_data.turnHistory[this.game.shared_data.turnHistory.length - 1];
        }

        if(turnInfo) {
            document.getElementById('gamePlayTrade').innerHTML = turnInfo.trade.toString();
            document.getElementById('gamePlayAttack').innerHTML = turnInfo.attack.toString();
            document.getElementById('gamePlayAuthority').innerHTML = turnInfo.authority.toString();

            //if its my turn, also display my played cards
            if(myTurn) {
                for(let c of (turnInfo as TurnInfo).cardsPlayed) {
                    document.getElementById('gamePlayAreaCards').appendChild(this.createFaceUpCard(c));
                }

                //go through the trade deck, highlight whats available
                for(let c of this.game.shared_data.tradeRow) {
                    const cardElement = document.getElementById('gameTradeRow').querySelector('[data-id="' + c.id + '"]');
                    if(c.cost <= turnInfo.trade) {
                        cardElement.classList.add('gameCardClickable');
                    }
                    else {
                        cardElement.classList.remove('gameCardClickable');
                    }
                }
            }     
        }
           

        //draw my space
        const myData = this.getUserData();
        for(let i = 0; i < myData.hand.length; ++i) {
            const cardElement = this.createFaceUpCard(myData.hand[i]);
            if(myTurn) {
                cardElement.classList.add('gameCardClickable');
            }
            document.getElementById('gameMyHand').appendChild(cardElement);
        }
        
        const myDiscardPile = this.drawDiscard(myData.discardPile);
        if(myDiscardPile) {
            document.getElementById('gameMyDiscard').appendChild(myDiscardPile);
        }

        const myDrawPile = this.drawDeck(myData.drawPile, myData.health);
        if(myDrawPile) {
            document.getElementById('gameMyDeck').appendChild(myDrawPile);
        }
    }

    private drawDeck(cards:IServicesCard[], showHealth?:number):HTMLDivElement {
        if(cards.length > 0) {
            const div = document.createElement('div');
            div.classList.add('gameCard');
            div.classList.add('gameCardBack');
            div.classList.add('gameCardDeck');

            const s = document.createElement('p');
            s.classList.add('gameDeckLeft')
            s.innerHTML = cards.length.toString();
            div.appendChild(s);

            if(showHealth !== null && showHealth !== undefined) {
                const h = document.createElement('p');
                h.classList.add('gamePlayerHealth')
                h.innerHTML = 'Health: ' + showHealth.toString();
                div.appendChild(h);
            }
            return div;
        }
        else if(showHealth !== null && showHealth !== undefined) {
            const h = document.createElement('p');
            h.classList.add('gamePlayerHealth')
            h.innerHTML = 'Health: ' + showHealth.toString();
            return h;
        }
    }

    private drawDiscard(cards: IServicesCard[]):HTMLDivElement {
        if(cards.length > 0) {
            return this.createFaceUpCard(cards[cards.length-1]);
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

    private createFaceDownCard(card: IServicesCard):HTMLDivElement {
        const div = document.createElement('div');
        div.classList.add('gameCard');
        div.classList.add('gameCardBack');
        return div;
    }
}