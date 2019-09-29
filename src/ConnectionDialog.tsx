import React, { ChangeEvent } from 'react';
import './ConnectionDialog.css';
import { postData } from './Utilities';

export interface ConnectionDialogProps { authToken:string, baseUrl:string, onStartGameClick:()=>void, onJoinGameClick:(id:string)=>void }
export interface ConnectionDialogState { connectError:string, gameIdInput:string, friendReady:boolean, gameStarted:string}

export class ConnectionDialog extends React.Component<ConnectionDialogProps, ConnectionDialogState> {
  


    constructor(props: ConnectionDialogProps) {
      super(props);
      this.state = {
        gameStarted: "",
        gameIdInput: "",
        friendReady: false,
        connectError: ""
      };

      this.handleJoin = this.handleJoin.bind(this);
      this.handleStart = this.handleStart.bind(this);
      this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e:ChangeEvent) {
      this.setState({ gameIdInput: (e.target as HTMLInputElement).value });
    }

    async handleJoin():Promise<void> {
      try {
        const gameData = await postData(this.props.baseUrl + 'game/join', {
            game_id: parseInt(this.state.gameIdInput),
            initial_state: {}
        }, this.props.authToken);
        
      }
      catch(e) {
          this.setState({connectError: 'Error ' + e });
      }
    }

    async handleStart():Promise<void> {
      try {
        const gameData = await postData(this.props.baseUrl + 'game/create', {
            initial_state: {},
            shared_state: {}
        }, this.props.authToken);
        this.setState({gameStarted:gameData.data.game_id});
      }
      catch(e) {
          this.setState({connectError: 'Error' + e });
      }
    }

    render() {
      if(this.state.gameStarted) {
          return (
            <div className='modalBackground'>
              <div className='dialog'>
                <div>
                  <div>
                  <button>Start Game</button><span className="gameIDSpan">{"Game ID: " + this.state.gameStarted}</span>
                  <p>Waiting for other players to join</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        else {
          return (
            <div className='modalBackground'>
              <div className='dialog'>
                <div>
                  <div>
                    <button onClick={this.handleStart}>Start Game</button>
                  </div>
                  <div>
                    <input type="text" placeholder="Enter Game ID" onChange={this.handleChange} /><button onClick={this.handleJoin}>Enter Game</button>
                  </div>
                  <p>{this.state.connectError}</p>
                </div>
              </div>
            </div>
          );
        }
      }
  }