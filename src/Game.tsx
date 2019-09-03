import React from 'react';
import { Deck } from './Deck';
import { CardData } from './CardData';


export interface GameProps { }
export interface GameState { }
export class Game extends React.Component<GameProps, GameState> {

  //TODO dynamic number of players and cards
  player1Cards:CardData[] = [];
  player2Cards:CardData[] = [];

  constructor(props:GameProps) {
    super(props);
    //TODO get real cards
    for(let i = 0; i < 52; ++i) {
      this.player1Cards.push(new CardData());
      this.player2Cards.push(new CardData());
    }
  }

    render() {
      return (
        <div className="game">
          <div className="game-board">
            <Deck cardDatas={this.player1Cards}/>
          </div>
        </div>
      );
    }
}
  