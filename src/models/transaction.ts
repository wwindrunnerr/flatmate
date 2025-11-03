import {User} from "@/models/user";

export class Transaction {
    name: string;
    user: User;
    price: number;
    date: string;

    constructor(name: string, user: User, price: number, date: string) {
        this.name = name;
        this.user = user;
        this.price = price;
        this.date = date;
    }
}
