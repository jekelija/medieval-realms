import React from 'react';
import './Common.css';
import './Player.css';

import {
    CardData
} from './CardData';
import {
    Card
} from './Card';
import { shuffle } from './Utilities';


export interface PlayerProps {
    cardDatas: CardData[], localPlayer: boolean
}
export interface PlayerState {
    hand: CardData[], draw: CardData[], discard: CardData[]
}
export class Player extends React.Component <PlayerProps, PlayerState> {

    constructor(props: PlayerProps) {
        super(props);
        const initialDraw = [...props.cardDatas];
        shuffle(initialDraw);
        this.state = {
            draw: initialDraw,
            discard: [],
            hand: []
        };

        
    }

    componentDidMount() {
        // Initial turn
        this.handleStartTurn();
    }

    handleStartTurn() {
        let discardReset = false;
        const hand = [];

        for (let i = 0; i < 5; ++i) {
            if (this.state.draw.length === 0) {
                this.state.draw.push(...this.state.discard);
                discardReset = true;
            }

            //are there still no cards? do nothing
            if (this.state.draw.length === 0) {
                continue;
            }

            const drawn = this.state.draw.shift();
            hand.push(drawn as CardData);
        }

        this.setState({
            hand: hand,
            discard: discardReset ? [] : this.state.discard,
            draw : this.state.draw
        });
    }

    handleEndTurn() {
        
    }


    


    render() {
        let flipped = this.props.localPlayer;
        const handCards = [];
        const discardCards = [];

        for(let h of this.state.hand) {
            handCards.push(<Card key={h.id} flipped={flipped} cardData={h}/>);
        }
        for(let h of this.state.discard) {
            discardCards.push(<Card key={h.id} flipped={true} cardData={h}/>);
        }

        const endTurnButton = this.props.localPlayer ? <button onClick={this.handleEndTurn}>End Turn</button> : null; 
        
        return (
            <div className="playerArea">
                <div className="deck">
                    <div className="cardGroup">
                        {handCards}
                    </div>
                    <div className="discard">
                        {discardCards}
                    </div>
                    <div className="draw">
                        <Card flipped={false}/>
                        <span className="drawNumber">{this.state.draw.length}</span>
                    </div>
                </div>
                {endTurnButton}
            </div>
        );
    }
}
  