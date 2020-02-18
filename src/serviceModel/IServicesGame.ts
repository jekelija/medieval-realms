import { IServicesGameState } from "./IServicesGameState";
import { IServicesPlayerState } from "./IServicesPlayerState";
import { IServicesSharedState } from "./IServicesSharedState";
import { IServicesChatInfo } from "./IServicesChatInfo";

export interface IServicesGame {
    gameid:string;
    gamestate: IServicesGameState;
    user1: string;
    user2: string;
    user1_data: IServicesPlayerState;
    user2_data: IServicesPlayerState;
    shared_data: IServicesSharedState;
    chatHistory: IServicesChatInfo[];
}