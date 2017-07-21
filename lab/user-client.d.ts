import { WebClient } from "vineyard-lawn/lab";
export interface User {
    username: string;
    password?: string;
}
export declare class UserClient {
    private webClient;
    private user;
    private password;
    private twoFactorSecret;
    constructor(webClient: WebClient);
    prepareTwoFactor(): Promise<string>;
    register(user: any): Promise<User>;
    login(): Promise<void>;
    logout(): Promise<void>;
    getWebClient(): WebClient;
    getUser(): User;
}
