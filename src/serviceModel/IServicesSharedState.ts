import {IServicesCard} from './IServicesCard';
import { IServicesTurnInfo } from './IServicesTurnHistory';
import { IServicesChatInfo } from './IServicesChatInfo';

export interface IServicesSharedState {
    tradeRow: IServicesCard[];
    drawPile: IServicesCard[];
    halflings: IServicesCard[];
    turnHistory: IServicesTurnInfo[];
    chatHistory: IServicesChatInfo[];
}
