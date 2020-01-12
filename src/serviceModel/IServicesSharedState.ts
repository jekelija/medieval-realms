import {IServicesCard} from './IServicesCard';
import { IServicesTurnInfo } from './IServicesTurnHistory';

export interface IServicesSharedState {
    tradeRow: IServicesCard[];
    drawPile: IServicesCard[];
    halflings: IServicesCard[];
    turnHistory: IServicesTurnInfo[];
}
