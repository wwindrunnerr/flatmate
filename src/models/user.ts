export type Avatar = {
    url: string;
    width?: number;
    height?: number;
    mime?: `image/${"png"|"jpeg"|"webp"|"gif"|"svg+xml"}`;
    blurDataURL?: string;              // tiny-base64 для placeholder в next/image
    updatedAt: string;                 // ISO строка
};

// "export" makes it visible outside of this file
export class User {
    name: string;
    age: number;
    gender: string;
    avatar: Avatar;

    constructor(name: string, age: number, gender: string, avatar: Avatar) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.avatar = avatar;
    }
}
