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
export interface GameState { 
    hand: CardData[], 
    draw: CardData[], 
    discard: CardData[]
}

export class Game extends React.Component<GameProps, GameState> {

  // playerCards:CardData[];
  // deck:CardData[];
  // tradeRow:CardData[];

  //TODO dynamic number of players
  constructor(props:GameProps) {
    super(props);

    // const initialDraw = [...props.cardDatas];
    // shuffle(initialDraw);
    // this.state = {
    //     draw: initialDraw,
    //     discard: [],
    //     hand: []
    // };

    // this.state = {
    //   localPlayer : new PlayerData(createUUID(), true),
    //   onlinePlayer1 : undefined
    // };

    // //TODO use real cards
    // this.playerCards = [];
    // this.deck = [];
    // this.tradeRow = [];
    // for(let i = 0; i < 10; ++i) {
    //   this.playerCards.push(new CardData());
    // }
    // for(let i = 0; i < 100; ++i) {
    //   this.deck.push(new CardData());
    // }
    // shuffle(this.deck);
    // for(let i = 0; i < 5; ++i) {
    //   this.tradeRow.push(this.deck.shift() as CardData);
    // }

    // this.handleStartGame = this.handleStartGame.bind(this);
    // this.handleJoinGame = this.handleJoinGame.bind(this);
  }

  // handleJoinGame(id: string) {
  //   const joinGameData = {
  //     type:"GameJoin",
  //     playerUUID: this.state.localPlayer.uuid,
  //     gameUUID:id
  //   };
  //   this.socket.send(JSON.stringify(joinGameData));
  // }

  // handleStartGame() {
  //   const startGameData = {
  //     type:"GameStart",
  //     playerUUID: this.state.localPlayer.uuid
  //   };
  //   this.socket.send(JSON.stringify(startGameData));
  // }

  // componentDidMount() {
  //   // Initial turn
  //   this.handleStartTurn();
  // }

  // handleStartTurn() {
  //     let discardReset = false;
  //     const hand = [];

  //     for (let i = 0; i < 5; ++i) {
  //         if (this.state.draw.length === 0) {
  //             this.state.draw.push(...this.state.discard);
  //             discardReset = true;
  //         }

  //         //are there still no cards? do nothing
  //         if (this.state.draw.length === 0) {
  //             continue;
  //         }

  //         const drawn = this.state.draw.shift();
  //         hand.push(drawn as CardData);
  //     }

  //     this.setState({
  //         hand: hand,
  //         discard: discardReset ? [] : this.state.discard,
  //         draw : this.state.draw
  //     });
  // }

  render() {
    return <div/>
    // let flipped = this.props.localPlayer;
    //     const handCards = [];
    //     const discardCards = [];

    //     for(let h of this.state.hand) {
    //         handCards.push(<Card key={h.id} flipped={flipped} cardData={h}/>);
    //     }
    //     for(let h of this.state.discard) {
    //         discardCards.push(<Card key={h.id} flipped={true} cardData={h}/>);
    //     }

    //     const endTurnButton = this.props.localPlayer ? <button onClick={this.handleEndTurn}>End Turn</button> : null; 
        
    //     return (
    //         <div className="playerArea">
    //             <div className="deck">
    //                 <div className="cardGroup">
    //                     {handCards}
    //                 </div>
    //                 <div className="discard">
    //                     {discardCards}
    //                 </div>
    //                 <div className="draw">
    //                     <Card flipped={false}/>
    //                     <span className="drawNumber">{this.state.draw.length}</span>
    //                 </div>
    //             </div>
    //             {endTurnButton}
    //         </div>
    //     );

    // const tradeRowCards = [];

    // for(let t of this.tradeRow) {
    //   tradeRowCards.push(<Card flipped={true} cardData={t} key={t.id}/>);
    // }

    // return (
    //   <div className="game">
    //     <div className="game-board">
    //       <div className="otherPlayerArea">
    //         <Player localPlayer={false} cardDatas={this.playerCards} />
    //       </div>
    //       <div className="tradeRow">
    //         <div className="tradeRowDraw">
    //           <Card flipped={true} cardData={undefined}/>
    //         </div>
    //         <div className="tradeRowFlipped cardGroup">
    //           {tradeRowCards}
    //         </div>
    //       </div>
    //       <div className="playingArea">

    //       </div>
    //       <div className="myPlayerArea">
    //         <Player localPlayer={true} cardDatas={this.playerCards} />
    //       </div>
    //     </div>
    //     <ConnectionDialog onJoinGameClick={this.handleStartGame} onStartGameClick={this.handleStartGame} socketConnect={this.socket}/>
    //  </div>
    // );
  }
}
  