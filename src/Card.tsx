import React from 'react';
import './Card.css';
import { CardData } from './CardData';

export interface CardProps { flipped:boolean, cardData:CardData }
export interface CardState { flipped:boolean, cardData:CardData }

export class Card extends React.Component<CardProps, CardState> {
  
    state: CardState;

    constructor(props: CardProps) {
      super(props);
      this.state = {
        flipped : props.flipped,
        cardData : props.cardData
      };
    }

    render() {
      return (
        <div className={this.props.flipped ? 'card flipped' : 'card'}/>
      );
    }
  }