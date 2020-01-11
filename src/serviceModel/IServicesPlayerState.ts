import {IServicesCard} from './IServicesCard';

export interface IServicesPlayerState {
    drawPile: IServicesCard[];
    hand: IServicesCard[];
    cardsPlayed: IServicesCard[];
}
