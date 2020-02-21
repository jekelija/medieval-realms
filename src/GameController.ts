import '../css/game';

import * as log from 'loglevel';

import { ViewManager, VIEW, IView } from "./ViewManager";
import { Services } from "./Services";
import { IServicesGame } from "./serviceModel/IServicesGame";
import { IServicesCard, CardActionType, Faction } from './serviceModel/IServicesCard';
import { emptyDiv, findAncestor } from './Utilts';
import { IServicesGameState } from './serviceModel/IServicesGameState';
import { TurnInfo } from './model/turninfo';
import { IServicesTurnInfo } from './serviceModel/IServicesTurnHistory';
import { IServicesPlayerState } from './serviceModel/IServicesPlayerState';

import { ImageExport } from './ImageExport';

const cache = {};

function importAll (r) {
  r.keys().forEach(key => cache[key] = r(key));
}
  
importAll(require.context('../assets/cards', true));

export class GameController implements IView {
    private game:IServicesGame;
    private currentTurn:TurnInfo = null;
    private refreshing = false;
    private trashing = false;

    private bigCardModalTimeout:NodeJS.Timeout = null;

    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('gameHome').addEventListener('click', e=> {
            viewManager.open(VIEW.USER_SCREEN);
        }); 
        const modalBackgrounds = document.getElementsByClassName('modalBackground');
        for(let i = 0; i < modalBackgrounds.length; ++i) {
            const mb = modalBackgrounds[i];
            mb.addEventListener('click', e=> {
                mb.classList.add('hidden');
            });
        }

        document.getElementById('gameOtherDiscard').addEventListener('click', e=> {
            this.showCardsModal(this.getOtherUserData().discardPile);
        });
        document.getElementById('gameOtherDeck').addEventListener('click', e=> {
            this.showCardsModal(this.getOtherUserData().drawPile);
        });
        document.getElementById('gameMyDiscard').addEventListener('click', e=> {
            this.showCardsModal(this.getUserData().discardPile);
        });
        document.getElementById('gameMyDeck').addEventListener('click', e=> {
            this.showCardsModal(this.getUserData().drawPile);
        });

        document.getElementById('gameLastTurnOk').addEventListener('click', e=> {
            document.getElementById('gameLastCardModalBackground').classList.add('hidden');
        });

        document.getElementById('gameChatText').addEventListener('keyup', e=> {
            if(e.key.toLowerCase() == 'enter' && this.game) {
                const input = e.currentTarget as HTMLInputElement;
                if(input.value) {
                    this.services.addChat(this.game.gameid, input.value).then(()=> {
                        input.value = '';
                        this.refreshGame();
                    });
                }
            }
        });

        document.getElementById('gameAttack').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                this.attack();
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
                        if(c.uuid === cardElement.dataset.uuid) {
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


        document.getElementById('gamePlayAreaCards').addEventListener('click', e=> {
            const cardElement = findAncestor(e.target as HTMLElement, 'gameCard') as HTMLDivElement;
            if(cardElement) {
                const card = this.findCard(cardElement, this.currentTurn.cardsPlayed);
                this.showBigCardModal(cardElement, card, this.isMyTurn());
            }
        });

        document.getElementById('gameMyHand').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                const cardElement = findAncestor(e.target as HTMLElement, 'gameCard') as HTMLDivElement;
                if(cardElement) {
                    if(this.trashing) {
                        if(this.hasTargetReticleOnCard(cardElement)) {
                            this.removeTargetReticle(cardElement);
                            this.trashCardFromHand(cardElement);
                            this.trashing = false;
                        }
                        else {
                            this.addTargetReticleToCard(cardElement);
                        }
                    }
                    else {
                        const card = this.findCard(cardElement, this.getUserData().hand);
                        this.bigCardOnFirstClick(cardElement, card, this.playCard.bind(this));
                    }
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
                const cardElement = findAncestor(e.target as HTMLElement, 'gameCard') as HTMLDivElement;
                if(cardElement) {
                    const card = this.findCard(cardElement, this.game.shared_data.tradeRow);
                    if(cardElement.classList.contains('gameCardClickable')) {
                        this.bigCardOnFirstClick(cardElement, card, this.buyCard.bind(this));
                    }
                    else {
                        this.showBigCardModal(cardElement, card);
                    }
                }
            }
        });
        document.getElementById('gameHalflings').addEventListener('click', e=> {
            if(this.isMyTurn()) {
                const cardElement = findAncestor(e.target as HTMLElement, 'gameCard') as HTMLDivElement;
                if(cardElement) {
                    if(cardElement.classList.contains('gameCardClickable')) {
                        this.bigCardOnFirstClick(cardElement, this.game.shared_data.halflings[0], this.buyCard.bind(this));
                    }
                    else {
                        this.showBigCardModal(cardElement, this.game.shared_data.halflings[0]);
                    }
                }
            }
        });
    }

    private bigCardOnFirstClick(cardElement:HTMLDivElement, card:IServicesCard, callback:(cardElement)=>void, enableClickableAreas?:boolean): void {
        if(this.hasTargetReticleOnCard(cardElement)) {
            clearTimeout(this.bigCardModalTimeout);
            this.removeTargetReticle(cardElement);
            callback(cardElement);
        }
        else {
            this.addTargetReticleToCard(cardElement);
            if(this.bigCardModalTimeout) {
                clearTimeout(this.bigCardModalTimeout);
            }
            this.bigCardModalTimeout = setTimeout(()=> {
                this.showBigCardModal(cardElement, card, enableClickableAreas);
            }, 800);
        }
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

    private showCardsModal(cards: IServicesCard[]): void {
        const div = document.getElementById('gameShowCards');
        emptyDiv(div);

        for(let c of cards) {
            const cardElement = this.createFaceUpCard(c);
            div.appendChild(cardElement);
        }

        document.getElementById('gameShowCardsModalBackground').classList.remove('hidden');
    }
    private showBigCardModal(cardElement: HTMLDivElement, card:IServicesCard, enableClickableAreas?:boolean): void {
        const div = document.getElementById('gameShowBigCard');
        emptyDiv(div);
        const cloneCard = cardElement.cloneNode(true) as HTMLDivElement;
        //remove target reticle
        this.removeTargetReticle(cloneCard);
        cloneCard.classList.remove('gameCardClickable');
        div.appendChild(cloneCard);

        if(cloneCard.dataset.isBase) {
            document.getElementById('gameShowBigCardModalBackground').getElementsByClassName('modal')[0].classList.add('baseRotate');
        }
        else {
            document.getElementById('gameShowBigCardModalBackground').getElementsByClassName('modal')[0].classList.remove('baseRotate');
        }

        if(enableClickableAreas) {
            
            const trashArea = document.createElement('div');
            trashArea.classList.add('bigCardTrashArea');
            cloneCard.appendChild(trashArea);
        }

        document.getElementById('gameShowBigCardModalBackground').classList.remove('hidden');
    }

    private async refreshGame(): Promise<void> {
        if(!this.refreshing) {
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
        this.trashing = false;

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

        this.draw(5);

        // send up to services, add refresh buttons so other user can see
        this.services.endTurn(this.game.gameid, this.game);

        //after sending to services (to ensure that turn info was stored ), clear out turn
        //refersh this.currentGame from service response
        this.currentTurn = null;
        this.refreshUI();
    }

    private draw(num: number): void {
        //draw new cards
        let cardsToDraw = this.getUserData().drawPile.length < num ? this.getUserData().drawPile.length : num;
        for(let i = 0; i < cardsToDraw; ++i) {
            this.getUserData().hand.push(this.getUserData().drawPile.shift());
        }
        //do we need to shuffle
        if(cardsToDraw < num) {
            const cardsStillNeeded = num - cardsToDraw;
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
    }

    private findCard(cardElement:HTMLElement, cards:IServicesCard[]):IServicesCard {
        for(let i = 0; i < cards.length; ++i) {
            const c = cards[i];
            if(c.uuid === cardElement.dataset.uuid) {
                return c;
            }
        }
        return null;
    }
 
    private buyCard(cardElement:HTMLElement):void {
        const buyableCards = this.game.shared_data.halflings.length > 0 ? this.game.shared_data.tradeRow.concat(this.game.shared_data.halflings[0]) : this.game.shared_data.tradeRow;
        for(let i = 0; i < buyableCards.length; ++i) {
            const c = buyableCards[i];
            if(c.uuid === cardElement.dataset.uuid) {
                if(this.game.shared_data.halflings[0] == c) {
                    this.game.shared_data.halflings.shift();
                }
                else {
                    //take card off top of draw pile and put in trade row
                    this.game.shared_data.tradeRow.splice(i, 1);
                    // check for no cards left
                    if(this.game.shared_data.drawPile.length > 0) {
                        const newCard = this.game.shared_data.drawPile.shift();
                        this.game.shared_data.tradeRow.push(newCard);
                    }
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
            if(c.uuid === cardElement.dataset.uuid) {
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

    private trashCardFromHand(cardElement:HTMLElement):void {
        const userdata = this.getUserData();
        for(let i = 0; i < userdata.hand.length; ++i) {
            const c = userdata.hand[i];
            if(c.uuid === cardElement.dataset.uuid) {
                userdata.hand.splice(i, 1);
                this.currentTurn.cardsTrashed.push(c);
            }
        }
    }

    private playCard(cardElement:HTMLElement):void {
        const userdata = this.getUserData();
        for(let i = 0; i < userdata.hand.length; ++i) {
            const c = userdata.hand[i];
            if(c.uuid === cardElement.dataset.uuid) {

                //does this card have any actions?
                if(c.extraActions && c.extraActions.length > 0) {
                    for(let a of c.extraActions) {
                        if(a.type == CardActionType.DRAW_CARD) {
                            if(a.modifier == null) {
                                this.draw(1);
                            }
                            else {
                                this.draw(a.modifier);
                            }
                        }
                        else if(a.type == CardActionType.TRASH_CARD) {
                            this.trashing = true;
                        }
                    }
                }

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
        this.refreshChat();
        this.refreshUI();
    }

    refreshChat(): void {
        if(!this.game || !this.game.chatHistory) {
            return;
        }
        const chats = document.getElementById('gameChatBox');
        //get the last item, and just add to the end
        let lastTime = Number.MIN_SAFE_INTEGER;
        if(chats.children.length > 0) {
            const lastChat = chats.children[chats.children.length-1];
            lastTime = parseInt((lastChat as HTMLElement).dataset.time);
        }
        let indexToStartAdding = 0;
        //as soon as i hit something that is earlier (or equal) to the last chat i have, stop
        for(let i = this.game.chatHistory.length-1; i >= 0; --i) {
            if(this.game.chatHistory[i].createdate <= lastTime) {
                indexToStartAdding = i+1;
                break;
            }
        }
        if(indexToStartAdding >= 0) {
            for(let i = indexToStartAdding; i < this.game.chatHistory.length; ++i) {
                const p = document.createElement('p');
                p.innerHTML = this.game.chatHistory[i].user + ': ' + this.game.chatHistory[i].message;
                p.classList.add('gameChatLine');
                p.dataset.time = this.game.chatHistory[i].createdate.toString();
                this.game.chatHistory[i].user == this.services.currentUser ? p.classList.add('gameChatLineMine') : p.classList.add('gameChatLineOther');
                chats.appendChild(p);
            }
        }
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
            cardElement.classList.add('baseRotate');
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
            const cardElement = this.createFaceUpCard(this.game.shared_data.halflings[0]);
            document.getElementById('gameHalflings').appendChild(cardElement);
            if(myTurn) {
                if(this.currentTurn.trade >= this.game.shared_data.halflings[0].cost) {
                    cardElement.classList.add('gameCardClickable');
                }
                else {
                    cardElement.classList.remove('gameCardClickable');
                }
            }
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
                const cardElement = document.getElementById('gameTradeRow').querySelector('[data-uuid="' + c.uuid + '"]');
                if(c.cost <= this.currentTurn.trade) {
                    cardElement.classList.add('gameCardClickable');
                }
                else {
                    cardElement.classList.remove('gameCardClickable');
                }
            }
        }  
        else {
            document.getElementById('gamePlayTrade').innerHTML = "0";
            document.getElementById('gamePlayAttack').innerHTML = "0";
            document.getElementById('gamePlayAuthority').innerHTML = "0";
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
            cardElement.classList.add('baseRotate');
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

    private getCardImageFile(card:IServicesCard):string {
        let prefix = './Unaligned/';
        if(card.faction == Faction.Dwarves) {
            prefix = './Dwarves/';
        }
        else if(card.faction == Faction.Elves) {
            prefix = './Elves/';
        }
        else if(card.faction == Faction.Orcs) {
            prefix = './Orcs/';
        }
        else if(card.faction == Faction.Knights) {
            prefix = './Knights/';
        }

        const cachedImage = cache[prefix+card.imageFilename];
        if(cachedImage) {
            return cachedImage.default;
        }
        return '';
    }

    private createFaceUpCard(card: IServicesCard):HTMLDivElement {
        const div = document.createElement('div');
        div.classList.add('gameCard');
        div.dataset.uuid = card.uuid;
        if(card.isBase) {
            div.dataset.isBase = "true";
        }
        div.style.backgroundImage = 'url(' + this.getCardImageFile(card) + ')';
        div.style.backgroundPosition = 'center'; 
        div.style.backgroundRepeat = 'no-repeat'; 
        div.style.backgroundSize = 'cover'; 

        //need face down card first
        // const img = document.createElement('img');
        // img.src = this.getCardImageFile(card);
        // img.classList.add('gameCardImage');
        // if(card.isBase) {
        //     img.classList.add('gameCardBaseImage');
        // }
        // div.appendChild(img);

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
        //remove all other target reticles
        const reticle = document.getElementsByClassName('gameCardTargetReticleContainer');
        while(reticle.length > 0) {
            reticle[0].remove();
        }


        const div = document.createElement('div');
        div.classList.add('gameCardTargetReticleContainer');

        const img = document.createElement('img');
        img.classList.add('gameCardTargetReticle');
        img.src = ImageExport.TARGET_RETICLE;
        div.appendChild(img);
        
        card.appendChild(div);
    }
}