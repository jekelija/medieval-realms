import React from 'react';
import './Common.css';
import './Game.css';

import { CardData } from './CardData';
import { Player } from './Player';
import { shuffle, createUUID } from './Utilities';
import { Card } from './Card';
import {ConnectionDialog} from './ConnectionDialog';
import { PlayerData } from './PlayerData';


export interface GameProps { }
export interface GameState { localPlayer:PlayerData, onlinePlayer1?:PlayerData }
export class Game extends React.Component<GameProps, GameState> {

  playerCards:CardData[];
  deck:CardData[];
  tradeRow:CardData[];
  socket: WebSocket;

  //TODO dynamic number of players
  constructor(props:GameProps) {
    super(props);

    this.state = {
      localPlayer : new PlayerData(createUUID(), true),
      onlinePlayer1 : undefined
    };

    //TODO use real cards
    this.playerCards = [];
    this.deck = [];
    this.tradeRow = [];
    for(let i = 0; i < 10; ++i) {
      this.playerCards.push(new CardData());
    }
    for(let i = 0; i < 100; ++i) {
      this.deck.push(new CardData());
    }
    shuffle(this.deck);
    for(let i = 0; i < 5; ++i) {
      this.tradeRow.push(this.deck.shift() as CardData);
    }

    this.socket = new WebSocket('ws://127.0.0.1:3012');

    // Listen for messages
    this.socket.addEventListener('message', (event)=> {
      console.log('Message from server ', event.data);
    });

    this.handleStartGame = this.handleStartGame.bind(this);
    this.handleJoinGame = this.handleJoinGame.bind(this);
  }

  handleJoinGame(id: string) {
    const joinGameData = {
      type:"GameJoin",
      playerUUID: this.state.localPlayer.uuid,
      gameUUID:id
    };
    this.socket.send(JSON.stringify(joinGameData));
  }

  handleStartGame() {
    const startGameData = {
      type:"GameStart",
      playerUUID: this.state.localPlayer.uuid
    };
    this.socket.send(JSON.stringify(startGameData));
  }

  render() {
    const tradeRowCards = [];

    for(let t of this.tradeRow) {
      tradeRowCards.push(<Card flipped={true} cardData={t} key={t.id}/>);
    }

    return (
      <div className="game">
        <div className="game-board">
          <div className="otherPlayerArea">
            <Player localPlayer={false} cardDatas={this.playerCards} />
          </div>
          <div className="tradeRow">
            <div className="tradeRowDraw">
              <Card flipped={true} cardData={undefined}/>
            </div>
            <div className="tradeRowFlipped cardGroup">
              {tradeRowCards}
            </div>
          </div>
          <div className="playingArea">

          </div>
          <div className="myPlayerArea">
            <Player localPlayer={true} cardDatas={this.playerCards} />
          </div>
        </div>
        <ConnectionDialog onJoinGameClick={this.handleStartGame} onStartGameClick={this.handleStartGame} socketConnect={this.socket}/>
     </div>
    );
  }
}
  