import { IServicesGame } from "./serviceModel/IServicesGame";
import { localStorageAvailable } from "./Utilts";

export class Services {

    public baseURL = 'https://sojg4gl93j.execute-api.us-east-1.amazonaws.com/dev/';

    public currentUser: string;

    constructor() {
        if(localStorageAvailable()) {
            this.currentUser = localStorage.getItem('token');
        }
    }

    async auth(username:string, password:string): Promise<void> {
        await this.request('users/login', 'POST', {
            userId: username, 
            password: password
        });
        //TODO should get token, not just store username
        this.currentUser = username;
        if(localStorageAvailable()) {
            localStorage.setItem('token', username);
        }
    }

    async endTurn(gameId: string, game:IServicesGame): Promise<void> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to create games'
            };
        }
        else if(!gameId) {
            throw {
                error: 'Must provide a valid game ID'
            };
        }
        const response = await this.request('games/' + gameId + '/' + this.currentUser + '/turn', 'POST', {
            sharedState : game.shared_data,
            playerData: this.currentUser === game.user1 ? game.user1_data : game.user2_data,
            otherPlayerHealth: this.currentUser === game.user1 ? game.user2_data.health : game.user1_data.health,
        });
        return response;
    }

    async joinGame(gameId: string): Promise<IServicesGame> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to create games'
            };
        }
        else if(!gameId) {
            throw {
                error: 'Must provide a valid game ID'
            };
        }
        const response = await this.request('games/' + gameId + '/' + this.currentUser, 'POST');
        return response;
    }

    async addChat(gameId: string, message:string): Promise<IServicesGame> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to chat'
            };
        }
        else if(!gameId) {
            throw {
                error: 'Must provide a valid game ID'
            };
        }
        const response = await this.request('games/' + gameId + '/' + this.currentUser + '/chat', 'POST', {
            message
        });
        return response;
    }

    async createGame():Promise<string> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to create games'
            };
        }
        const response = await this.request('games/user/' + this.currentUser, 'POST');
        return response.gameid;
    }

    async getGames():Promise<IServicesGame[]> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to get games'
            };
        }
        return this.request('games/user/' + this.currentUser, 'GET');
    }

    async getGame(gameId:string):Promise<IServicesGame> {
        if(!this.currentUser) {
            throw {
                error: 'User must be logged in to get games'
            };
        }
        return this.request('games/' + gameId + '/' + this.currentUser, 'GET');
    }

    private async request(url:string, method:string, data?:any): Promise<any> {
        // Create the XHR request
        const request = new XMLHttpRequest();

        // Return it as a Promise
        return new Promise((resolve, reject)=> {
    
            // Setup our listener to process compeleted requests
            request.onreadystatechange = ()=> {
    
                // Only run if the request is complete
                if (request.readyState !== 4) return;
    
                // Process the response
                if (request.status >= 200 && request.status < 300) {
                    // If successful
                    resolve(JSON.parse(request.response));
                } else {
                    // If failed
                    reject({
                        status: request.status,
                        statusText: request.statusText,
                        error: JSON.parse(request.response).error
                    });
                }
    
            };
    
            // Setup our HTTP request
            request.open(method || 'GET', this.baseURL + url, true);

            // Send the request
            if(data) {
                request.setRequestHeader('Content-Type', 'application/json');
                request.send(JSON.stringify(data));
            }
            else {
                request.send();
            }
    
        });
    }
}