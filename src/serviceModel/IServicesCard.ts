export enum Faction {
    Orcs= 0,
    Knights= 1,
    Elves= 2,
    Dwarves= 3,
    None= 4
}

export interface IServicesCard
{
    id: string;
    faction: Faction;
    name:string;

    cost: number;
    trade: number;
    authority: number;
    attack: number;

    trashTrade: number;
    trashAuthority: number;
    trashAttack: number;
}
