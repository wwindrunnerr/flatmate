import {User} from "@/models/user";
import {Good} from "@/models/good";
import {Putzplan} from "@/models/putzplan";
import {Transaction} from "@/models/transaction";
import {Note} from "@/models/note";

export class Wg {
    title: string;
    description: string;
    image: string;
    putzplan: Putzplan;
    users: User[];
    inventar: Good[];
    einkaufsliste: Good[];
    transactions: Transaction[];
    events: Event[];
    pinnwand: Note[];


    constructor(title: string, description: string, image: string, users: User[]) {
        this.title = title;
        this.description = description;
        this.image = image;
        this.putzplan = new Putzplan();
        this.users = users;
        this.inventar = [];
        this.einkaufsliste = [];
        this.transactions = [];
        this.events = [];
        this.pinnwand = [];
    }



}