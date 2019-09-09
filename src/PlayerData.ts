export class PlayerData {
    health: number;

    constructor(public uuid: string, public isLocal:boolean) {
        this.health = 50;
    }
}