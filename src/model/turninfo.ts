import { IServicesCard } from "../serviceModel/IServicesCard";

export class TurnInfo {
    public trade: number = 0;
    public attack: number = 0;
    public authority: number = 0;

    public totalAttack: number = 0;
    public totalTrade: number = 0;

    public cardsPlayed: IServicesCard[] = [];
    public cardsAcquired: IServicesCard[] = [];
    public cardsTrashed: IServicesCard[] = [];
}
