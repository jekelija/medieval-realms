import React from 'react';
import './Common.css';
import './Game.css';

import { CardData } from './CardData';
import { Player } from './Player';
import { shuffle } from './Utilities';
import { Card } from './Card';


export interface GameProps { }
export interface GameState { player1Health:number, player2Health:number }
export class Game extends React.Component<GameProps, GameState> {

  playerCards:CardData[];
  deck:CardData[];
  tradeRow:CardData[];

  //TODO dynamic number of players
  constructor(props:GameProps) {
    super(props);

    this.state = {
      player1Health : 50,
      player2Health : 50
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

    const socket = new WebSocket('ws://127.0.0.1:3012');
    // Connection opened
    socket.addEventListener('open', function (event) {
      socket.send('Hello Server!');
    });

    // Listen for messages
    socket.addEventListener('message', function (event) {
      console.log('Message from server ', event.data);
    });
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
      </div>
    );
  }
}
  