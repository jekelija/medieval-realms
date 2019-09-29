import React from 'react';
import './Common.css';
import './Player.css';

import {LoginDialog} from './LoginDialog';
import { ConnectionDialog } from './ConnectionDialog';


export interface PlayerProps {
    baseUrl: string
}
export interface PlayerState {
    authToken: string;
    connectError: string;
}
export class Player extends React.Component <PlayerProps, PlayerState> {

    constructor(props: PlayerProps) {
        super(props);

        this.state = {
            authToken: '',
            connectError: ''
        };

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleStartGame = this.handleStartGame.bind(this);
        this.handleJoinGame = this.handleJoinGame.bind(this);
    }

    handleLoginSuccess(authToken: string) {
        this.setState({authToken : authToken});
    }

    async handleJoinGame(id: string): Promise<void> {
        
    }

    async handleStartGame():Promise<void> {
        
    }

    render() {
        if(this.state.authToken) {
            return (
            <div>
                <div>
                    <ConnectionDialog authToken={this.state.authToken} baseUrl={this.props.baseUrl} onJoinGameClick={this.handleJoinGame} onStartGameClick={this.handleStartGame} />
                </div>
            </div>
            );
        }
        else {
            return (
            <div>
                <LoginDialog onLoginSuccess={this.handleLoginSuccess} baseUrl={this.props.baseUrl} />
            </div>
            );
        }
    }
}
  