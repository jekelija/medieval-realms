import React from 'react';
import './Card.css';
import { CardData, Ability } from './CardData';
import { AbilityMessagesEnglish } from './messaging';

export interface CardProps { flipped:boolean, cardData?:CardData }
export interface CardState { flipped:boolean}

export class Card extends React.Component<CardProps, CardState> {
  
    state: CardState;

    constructor(props: CardProps) {
      super(props);
      this.state = {
        flipped : props.flipped,
      };
    }

    private getAbilitiesDiv(cardAbilities:Ability[]):JSX.Element | null {
      let abilitiesDiv:JSX.Element;
      const abilities = []

      for (let a of cardAbilities) {
        abilities.push(<p key={a}>{AbilityMessagesEnglish[a]}</p>)
      }
      if(abilities.length > 0) {
          abilitiesDiv = <div>{abilities}</div>
          return abilitiesDiv;
      }
      return null;
    }

    render() {
      //if no card data, render empty card; used for draw pile
      if(!this.props.cardData || !this.props.flipped) {
        return <div className={this.state.flipped ? 'card flipped' : 'card'}/>
      }
      else {
        const abilitiesDiv = this.getAbilitiesDiv(this.props.cardData.abilities);
        const abilitiesFactionDiv = this.getAbilitiesDiv(this.props.cardData.abilitiesFaction);
        const abilitiesScrapDiv = this.getAbilitiesDiv(this.props.cardData.abilitiesScrap);

        return (
          <div className={this.state.flipped ? 'card flipped' : 'card'}>
            <p>{this.props.cardData.name}</p>
            <div className="stats">
              <span className="attack">{this.props.cardData.attack}/{this.props.cardData.attackFaction}</span>
              <span className="trade">{this.props.cardData.trade}/{this.props.cardData.tradeFaction}</span>
              <span className="health">{this.props.cardData.health}/{this.props.cardData.healthFaction}</span>
            </div>
            {abilitiesDiv}
            {abilitiesFactionDiv}
            {abilitiesScrapDiv}
          </div>
        );
      }

      
    }
  }