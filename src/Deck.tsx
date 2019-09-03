import React from 'react';
import './Deck.css';
import { CardData } from './CardData';
import { Card } from './Card';

export interface DeckProps { cardDatas:CardData[] }
export interface DeckState { cardDatas:CardData[], currentIndex: number }

export class Deck extends React.Component<DeckProps, DeckState> {

    state: DeckState;

    constructor(props: DeckProps) {
      super(props);
      this.shuffle(props.cardDatas);
      this.state = {
        cardDatas : props.cardDatas,
        currentIndex: 0
      };
    }

    render() {
      const handCards = []

      for (let i = this.state.currentIndex; i < this.state.currentIndex+5; ++i) {
        handCards.push(<Card flipped={true} cardData={this.state.cardDatas[i]}/>)
      }

      //TODO if we hit the end of the deck, shuffle and cycle

      return (
        <div className="deck">
          <div className="hand">
            {handCards}
          </div>
        </div>
      );
    }


    shuffle(array:CardData[]):void {
      let currentIndex = array.length, temporaryValue, randomIndex;
    
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
    }
  }