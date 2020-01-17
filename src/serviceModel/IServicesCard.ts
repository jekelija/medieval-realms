export enum Faction {
    Orcs= 0,
    Knights= 1,
    Elves= 2,
    Dwarves= 3,
    None= 4
}

export enum CardActionType {
    DRAW_CARD= 0,
    DISCARD_CARD= 1,
    TRASH_CARD= 2,
    NEXT_SHIP_TO_TOP_OF_DECK= 3,
    OPPONENT_DISCARD= 4,
    TRASH_IN_TRADE_ROW= 5,
}

export interface IServicesCardAction {
    type: CardActionType;
    // only needed for certain types.
    // For example, if type is draw card, no modifier == draw 1 card. if modifier is 2, draw 2 cards
    modifier?: number;
}

export interface IServicesCard
{
    id: string;
    faction: Faction;
    name:string;
    isBase: boolean;

    cost: number;
    trade: number;
    authority: number;
    attack: number;

    trashTrade: number;
    trashAuthority: number;
    trashAttack: number;

    factionBonusTrade: number;
    factionBonusAuthority: number;
    factionBonusAttack: number;
    imageFilename: string;

    extraActions: IServicesCardAction[];
    extraFactionActions: IServicesCardAction[];
    extraTrashActions: IServicesCardAction[];
}
