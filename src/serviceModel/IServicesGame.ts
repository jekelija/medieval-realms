import { IServicesGameState } from "./IServicesGameState";

export interface IServicesGame {
    gameid:string;
    gamestate: IServicesGameState;
    user1: string;
    user2: string;
}