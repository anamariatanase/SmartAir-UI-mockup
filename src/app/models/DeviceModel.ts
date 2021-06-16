export class DeviceModel {
    public active: boolean;
    public username: string;
    public type: string;

    constructor(active?, username?, type?) {
        this.active = active;
        this.username = username;
        this.type = type;
    }
}
