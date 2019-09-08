export enum Faction {
    Orcs = 0,
    Knights = 1,
    Elves = 2,
    Dwarves = 3
}

export enum Ability {
    DRAW = 0,
    SCRAP_HAND = 1,
    SCRAP_DISCARD = 2,
    SCRAP_HAND_OR_DISCARD = 3,
    SCRAP_TRADE_ROW = 4,
    OPPONENT_DISCARD = 5
    //TODO MORE
}

let cardNumber = 0;

export class CardData {

    id:number;
    attack: number;
    trade: number;
    health: number;
    attackFaction: number;
    tradeFaction: number;
    healthFaction: number;
    attackScrap: number;
    tradeScrap: number;
    healthScrap: number;

    faction: Faction;
    name: string;

    abilities:Ability[] = []; 
    abilitiesFaction:Ability[] = []; 
    abilitiesScrap: Ability[] = [];

    constructor() {
        this.id = ++cardNumber;
        this.attack = Math.floor(Math.random()*6);
        this.trade = Math.floor(Math.random()*4);
        this.health = Math.floor(Math.random()*6);
        this.attackFaction = Math.floor(Math.random()*6);
        this.tradeFaction = Math.floor(Math.random()*6);
        this.healthFaction = Math.floor(Math.random()*6);
        this.attackScrap = Math.floor(Math.random()*2);
        this.tradeScrap = Math.floor(Math.random()*2);
        this.healthScrap = Math.floor(Math.random()*2);
        this.faction = Math.floor(Math.random()*4)-1;

        if(Math.random() > .5) {
            this.abilitiesScrap.push(Math.floor(Math.random()*6)-1);
        }
        if(Math.random() > .7) {
            this.abilitiesScrap.push(Math.floor(Math.random()*6)-1);
        }
        if(Math.random() > .9) {
            this.abilitiesScrap.push(Math.floor(Math.random()*6)-1);
        }

        this.name = "Random card " + Math.floor(Math.random()*10000);
    }
}