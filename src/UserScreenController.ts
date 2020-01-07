import '../css/userScreen';

import * as log from 'loglevel';

import '../css/userScreen';

import { Services } from './Services';
import { IView, VIEW, ViewManager } from './ViewManager';

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

        (document.getElementById('userScreenCreateGame') as HTMLButtonElement).disabled = false;
    }

    private async getGames(): Promise<void> {
        const games = await this.services.getGames();

        for(let g of games) {

        }
    }

    type(): VIEW {
        return VIEW.USER_SCREEN;
    }

    element(): HTMLDivElement {
        return document.getElementById('userScreenView') as HTMLDivElement;
    }

}