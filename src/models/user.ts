export type Avatar = {
    url: string;
    width?: number;
    height?: number;
    mime?: `image/${"png" | "jpeg" | "webp" | "gif" | "svg+xml"}`;
    blurDataURL?: string;
    updatedAt: string;
};

export class User {
    name: string;
    age: number;
    gender: string;
    email: string;


    constructor(name: string, age: number, gender: string, email: string) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.email = email;

    }
}
