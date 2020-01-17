import {IServicesCard} from './IServicesCard';

export interface IServicesPlayerState {
    drawPile: IServicesCard[];
    hand: IServicesCard[];
    discardPile: IServicesCard[];
    basesInPlay: IServicesCard[];
    health: number;
}
