import '../css/game';

import * as log from 'loglevel';

import { ViewManager, VIEW, IView } from "./ViewManager";
import { Services } from "./Services";
import { IServicesGame } from "./serviceModel/IServicesGame";
import { IServicesCard } from './serviceModel/IServicesCard';
import { emptyDiv, findAncestor } from './Utilts';
import { IServicesGameState } from './serviceModel/IServicesGameState';
import { TurnInfo } from './model/turninfo';
import { IServicesTurnInfo } from './serviceModel/IServicesTurnHistory';
import { IServicesPlayerState } from './serviceModel/IServicesPlayerState';

import { ImageExport } from './ImageExport';

export class GameController implements IView {
    private game:IServicesGame;
    private currentTurn:TurnInfo = null;
    private refreshing = false;

    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('gameHome').addEventListener('click', e=> {
            viewManager.open(VIEW.USER_SCREEN);
        }); 

        document.getElementById('gameLastTurnOk').addEventListener('click', e=> {
            document.getElementById('gameLastCardModalBackground').classList.add('hidden');
        });

        document.getElementById('gameOtherDeck').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                if(this.hasTargetReticleOnCard(e.currentTarget as HTMLDivElement)) {
                    this.removeTargetReticle(e.currentTarget as HTMLDivElement);
                    this.attack();
                }
                else if(this.canAttack() && this.currentTurn.attack > 0) {
                    this.addTargetReticleToCard(e.currentTarget as HTMLDivElement);
                }
            }
            
        });

        document.getElementById('gameOtherBases').addEventListener('click', e=> {
            const cardElement = findAncestor(e.target as HTMLElement, 'gameCard');
            if(cardElement && this.isMyTurn()) {
                if(this.hasTargetReticleOnCard(cardElement as HTMLDivElement)) {
                    this.removeTargetReticle(cardElement as HTMLDivElement);
                    this.attackBase(cardElement as HTMLDivElement);
                }
                else {
                    for(let i = 0; i < this.getOtherUserData().basesInPlay.length; ++i) {
                        const c = this.getOtherUserData().basesInPlay[i];
                        if(c.id === cardElement.dataset.id) {
                            //if im an outpost, can always attack, otherwise must be attackable
                            if(this.currentTurn.attack >= c.baseDefense && (c.isOutpost || this.canAttack())) {
                                this.addTargetReticleToCard(cardElement as HTMLDivElement);
                            }
                            break;
                        }
                    }
                }
            }
            
        });

        document.getElementById('gameMyHand').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                const card = findAncestor(e.target as HTMLElement, 'gameCard');
                if(card) {
                    this.playCard(card);
                }
            }
        });
        document.getElementById('gameRefresh').addEventListener('click', e=> {
            this.refreshGame();
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

    private canAttack(): boolean {
        let hasBaseDefenseLeft = false;
        for(let b of this.getOtherUserData().basesInPlay) {
            if(b.isOutpost) {
                hasBaseDefenseLeft = true;
                break;
            }
        }
        return !hasBaseDefenseLeft;
    }

    private async refreshGame(): Promise<void> {
        if(!this.isMyTurn() && !this.refreshing) {
            try {
                this.refreshing = true;
                if(this.game) {
                    const game = await this.services.getGame(this.game.gameid);
                    this.initializeGame(game);

                }
            } catch (e) {
                log.error(e);
            }
            this.refreshing = false;
        }
        
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

        //draw new cards
        let cardsToDraw = this.getUserData().drawPile.length < 5 ? this.getUserData().drawPile.length : 5;
        for(let i = 0; i < cardsToDraw; ++i) {
            this.getUserData().hand.push(this.getUserData().drawPile.shift());
        }
        //do we need to shuffle
        if(cardsToDraw < 5) {
            const cardsStillNeeded = 5 - cardsToDraw;
            //move discard to draw
            this.getUserData().drawPile = this.getUserData().discardPile.splice(0, this.getUserData().discardPile.length);
            //shuffle the draw pile
            this.getUserData().drawPile.sort(() => Math.random() - 0.5)
            //make sure we didnt run out of cards
            const cardsToDrawFromNewDrawPile = this.getUserData().drawPile.length < cardsStillNeeded ? this.getUserData().drawPile : cardsStillNeeded;
            for(let i = 0; i < cardsToDrawFromNewDrawPile; ++i) {
                this.getUserData().hand.push(this.getUserData().drawPile.shift());
            }
        }

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

    private attackBase(cardElement:HTMLDivElement): void {
        for(let i = 0; i < this.getOtherUserData().basesInPlay.length; ++i) {
            const c = this.getOtherUserData().basesInPlay[i];
            if(c.id === cardElement.dataset.id) {
                this.getOtherUserData().basesInPlay.splice(i, 1);
                this.getOtherUserData().discardPile.push(c);
                this.currentTurn.totalAttack += c.baseDefense;
                this.currentTurn.attack -= c.baseDefense;
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
                if(c.isBase) {
                    this.getUserData().basesInPlay.push(c);
                }
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
        this.initializeGame(game);
    }

    initializeGame(game:IServicesGame): void {
        if(!game) {
            throw {
                error: 'No game provided'
            };
        }
        this.game = game;
        if(this.isMyTurn() && !this.currentTurn) {
            this.startTurn();
            if(this.game.shared_data.turnHistory.length > 0) {
                const lastOtherPlayerTurn = this.game.shared_data.turnHistory[this.game.shared_data.turnHistory.length - 1];
                document.getElementById('gameLastTrade').innerHTML = lastOtherPlayerTurn.trade.toString();
                document.getElementById('gameLastAttack').innerHTML = lastOtherPlayerTurn.attack.toString();
                document.getElementById('gameLastAuthority').innerHTML = lastOtherPlayerTurn.authority.toString();

                const cardsBoughtDiv = document.getElementById('gameLastCardsBought');
                emptyDiv(cardsBoughtDiv);

                for(let c of lastOtherPlayerTurn.cardsAcquired) {
                    const p = document.createElement('p');
                    p.innerHTML = c;
                    cardsBoughtDiv.appendChild(p);
                }

                const cardsTrashedDiv = document.getElementById('gameLastCardsTrashed');
                emptyDiv(cardsTrashedDiv);

                for(let c of lastOtherPlayerTurn.cardsTrashed) {
                    const p = document.createElement('p');
                    p.innerHTML = c;
                    cardsTrashedDiv.appendChild(p);
                }

                document.getElementById('gameLastCardModalBackground').classList.remove('hidden');
            }
        }
        this.refreshUI();
    }

    startTurn(): void {
        this.currentTurn = new TurnInfo();
        //go through my bases and add to total
        for(let b of this.getUserData().basesInPlay) {
            this.updateCurrentStock(b.trade, b.attack, b.authority);
        }
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
        emptyDiv(document.getElementById('gameMyBases'));
        emptyDiv(document.getElementById('gamePlayAreaCards'));
        emptyDiv(document.getElementById('gameOtherDeck'));
        emptyDiv(document.getElementById('gameOtherDiscard'));
        emptyDiv(document.getElementById('gameOtherHand'));
        emptyDiv(document.getElementById('gameOtherBases'));

        
        //go top to bottom
        //TODO do as diff

        //other players
        const otherData = this.getOtherUserData();
        for(let i = 0; i < otherData.hand.length; ++i) {
            const cardElement = this.createFaceDownCard(otherData.hand[i]);
            document.getElementById('gameOtherHand').appendChild(cardElement);
        }
        for(let i = 0; i < otherData.basesInPlay.length; ++i) {
            const cardElement = this.createFaceUpCard(otherData.basesInPlay[i]);
            document.getElementById('gameOtherBases').appendChild(cardElement);
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

        //if its my turn, display played cards and totals
        if(myTurn) {
            document.getElementById('gamePlayTrade').innerHTML = this.currentTurn.trade.toString();
            document.getElementById('gamePlayAttack').innerHTML = this.currentTurn.attack.toString();
            document.getElementById('gamePlayAuthority').innerHTML = this.currentTurn.authority.toString();

            for(let c of this.currentTurn.cardsPlayed) {
                if(!c.isBase) {
                    document.getElementById('gamePlayAreaCards').appendChild(this.createFaceUpCard(c));
                }
            }

            //go through the trade deck, highlight whats available
            for(let c of this.game.shared_data.tradeRow) {
                const cardElement = document.getElementById('gameTradeRow').querySelector('[data-id="' + c.id + '"]');
                if(c.cost <= this.currentTurn.trade) {
                    cardElement.classList.add('gameCardClickable');
                }
                else {
                    cardElement.classList.remove('gameCardClickable');
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
        for(let i = 0; i < myData.basesInPlay.length; ++i) {
            const cardElement = this.createFaceUpCard(myData.basesInPlay[i]);
            document.getElementById('gameMyBases').appendChild(cardElement);
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
        c.innerHTML = 'C: ' + card.cost;
        div.appendChild(c);
        const cardAttributes = document.createElement('div');
        cardAttributes.classList.add('gameCardAttributeRow');

        if(card.trade > 0) {
            const t = document.createElement('p');
            t.innerHTML = 'T: ' + card.trade;
            cardAttributes.appendChild(t);
        }
        if(card.attack > 0) {
            const a = document.createElement('p');
            a.innerHTML = 'A: ' + card.attack;
            cardAttributes.appendChild(a);
        }
        if(card.authority > 0) {
            const h = document.createElement('p');
            h.innerHTML = 'H: ' + card.authority;
            cardAttributes.appendChild(h);
        }
        div.appendChild(cardAttributes);
        if(card.isBase) {
            const b = document.createElement('p');
            if(card.isOutpost) {
                b.innerHTML = 'Outpost ' + card.baseDefense;
            }
            else {
                b.innerHTML = 'Base ' + card.baseDefense;
            }
            div.appendChild(b);
        }
        return div;
    }

    private createFaceDownCard(card: IServicesCard):HTMLDivElement {
        const div = document.createElement('div');
        div.classList.add('gameCard');
        div.classList.add('gameCardBack');
        return div;
    }



    private removeTargetReticle(card: HTMLDivElement): void {
        const reticle = card.getElementsByClassName('gameCardTargetReticleContainer');
        if(reticle.length > 0) {
            reticle[0].remove();
        }
    }

    private hasTargetReticleOnCard(card: HTMLDivElement): boolean {
        return card.getElementsByClassName('gameCardTargetReticleContainer').length > 0;
    }

    private addTargetReticleToCard(card: HTMLDivElement): void {
        const div = document.createElement('div');
        div.classList.add('gameCardTargetReticleContainer');

        const img = document.createElement('img');
        img.classList.add('gameCardTargetReticle');
        img.src = ImageExport.TARGET_RETICLE;
        div.appendChild(img);
        
        card.appendChild(div);
    }
}