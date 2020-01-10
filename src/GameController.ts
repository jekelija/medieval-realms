import '../css/game';

import { ViewManager, VIEW, IView } from "./ViewManager";
import { Services } from "./Services";
import { IServicesGame } from "./serviceModel/IServicesGame";
import { IServicesCard } from './serviceModel/IServicesCard';
import { emptyDiv } from './Utilts';

export class GameController implements IView {
    private game:IServicesGame;
    constructor(private viewManager:ViewManager, private services: Services) {
        
    }

    open(game:IServicesGame):void {
        if(!game) {
            throw {
                error: 'No game provided'
            };
        }
        this.game = game;
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
            document.getElementById('gameMyHand').appendChild(this.createFaceUpCard(myData.hand[i]));
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

        const a = document.createElement('p');
        a.innerHTML = 'Attack: ' + card.attack;
        const t = document.createElement('p');
        t.innerHTML = 'Trade: ' + card.trade;
        const auth = document.createElement('p');
        auth.innerHTML = 'Authority: ' + card.authority;
        div.appendChild(a);
        div.appendChild(t);
        div.appendChild(auth);
        return div;
    }
}