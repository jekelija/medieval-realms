import React from 'react';
import './Common.css';
import './Player.css';

import {LoginDialog} from './LoginDialog';
import { ConnectionDialog } from './ConnectionDialog';


export interface PlayerProps {
    baseUrl: string
}
export interface PlayerState {
    loggedIn: boolean;
}
export class Player extends React.Component <PlayerProps, PlayerState> {

    constructor(props: PlayerProps) {
        super(props);

        this.state = {
            loggedIn: false
        };

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
    }

    handleLoginSuccess() {
        this.setState({loggedIn : true});
    }

    handleJoinGame(id: string) {
        
    }

    handleStartGame() {
        
    }

    render() {
        if(this.state.loggedIn) {
            return (<div>
                <ConnectionDialog onJoinGameClick={this.handleJoinGame} onStartGameClick={this.handleStartGame} />
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
  