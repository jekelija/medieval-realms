import React, { ChangeEvent } from 'react';
import './ConnectionDialog.css';

export interface ConnectionDialogProps { onStartGameClick:()=>void, onJoinGameClick:(id:string)=>void, socketConnect: WebSocket }
export interface ConnectionDialogState { gameIdInput:string, ready: boolean, friendReady:boolean, gameStarted:string}

export class ConnectionDialog extends React.Component<ConnectionDialogProps, ConnectionDialogState> {
  


    constructor(props: ConnectionDialogProps) {
      super(props);
      this.state = {
        ready: false,
        gameStarted: "",
        gameIdInput: "",
        friendReady: false,

      };
      // Listen for messages
      props.socketConnect.addEventListener('open', (event)=> {
        this.setState({ready:true});
      });
      props.socketConnect.addEventListener('message', (event)=> {
        const json = JSON.parse(event.data);
        if(json.type === "GameCreated") {
          this.setState({gameStarted:json.uuid});
        }
      });

      this.handleJoin = this.handleJoin.bind(this);
      this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e:ChangeEvent) {
      this.setState({ gameIdInput: (e.target as HTMLInputElement).value });
    }

    handleJoin(e:MouseEvent) {
      this.props.onJoinGameClick(this.state.gameIdInput);
    }

    render() {
      if(!this.state.ready) {
        return (
          <div className='modalBackground'>
            <div className='connectionDialog'>
              <p>You are connecting, please wait...</p>
            </div>
          </div>
        );
      }
      else if(this.state.gameStarted) {
        return (
          <div className='modalBackground'>
            <div className='connectionDialog'>
              <p>You are connected to the server</p>
              <div>
                <div>
                <button onClick={this.props.onStartGameClick}>Start Game</button><span className="gameIDSpan">{"Game ID: " + this.state.gameStarted}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      else {
        return (
          <div className='modalBackground'>
            <div className='connectionDialog'>
              <p>You are connected to the server</p>
              <div>
                <div>
                  <button onClick={this.props.onStartGameClick}>Start Game</button>
                </div>
                <div>
                  <input type="text" placeholder="Enter Game ID" onChange={this.handleChange} /><button>Enter Game</button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
    }
  }