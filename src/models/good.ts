
export class Good {
    name: string;
    price: number;
    amount: number;
    istVorhanden: boolean;

    constructor(name: string, price: number, istVorhanden: boolean) {
        this.name = name;
        this.price = price;
        this.amount = 0;
        this.istVorhanden = istVorhanden;
    }
}
