import '../css/login';

import * as log from 'loglevel';

import { Services } from './Services';
import { IView, VIEW, ViewManager } from './ViewManager';

export class LoginController implements IView {
    constructor(private viewManager:ViewManager, private services: Services) {
        document.getElementById('loginButton').addEventListener('click', e=> {
            this.login((document.getElementById('loginUsername') as HTMLInputElement).value, (document.getElementById('loginPassword') as HTMLInputElement).value);
        });
        document.getElementById('loginView').addEventListener('keyup', e=> {
            if(e.key == 'Enter') {
                this.login((document.getElementById('loginUsername') as HTMLInputElement).value, (document.getElementById('loginPassword') as HTMLInputElement).value);
            }
        });
    }

    open():void {

    }
    
    close():void {
        
    }

    type(): VIEW {
        return VIEW.LOGIN;
    }

    element(): HTMLDivElement {
        return document.getElementById('loginView') as HTMLDivElement;
    }

    private async login(loginUsername: string, loginPassword: string): Promise<void> {
        (document.getElementById('loginButton') as HTMLButtonElement).disabled = true;
        const errorElement = document.getElementById('loginError');
        errorElement.innerHTML = '';
        if(!loginUsername) {
            errorElement.innerHTML = 'Please enter username';
        }
        else if(!loginPassword) {
            errorElement.innerHTML = 'Please enter password'; 
        }
        else {
            try {
                await this.services.auth(loginUsername, loginPassword);
                this.viewManager.open(VIEW.USER_SCREEN);
            }
            catch(err) {
                log.error(err);
                if(err.error) {
                    errorElement.innerHTML = err.error;
                }
                else {
                    errorElement.innerHTML = 'An error occurred trying to login';
                }
            }
        }
        (document.getElementById('loginButton') as HTMLButtonElement).disabled = false;
    }
}