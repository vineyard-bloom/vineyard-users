import { WebClient } from "vineyard-lawn/lab";
export declare type UserIdentifier = {
    email: string;
} | {
    username: string;
} | {
    id: string;
};
export interface CreateUserData extends UserIdentifier {
    password: string;
    twoFactorSecret?: string;
}
export declare class UserClient<CreateUserResponse> {
    private webClient;
    private createUserResponse;
    private password;
    private twoFactorSecret;
    private userIdentifier;
    constructor(webClient: WebClient);
    prepareTwoFactor(): Promise<string>;
    register(createUser: CreateUserData): Promise<CreateUserResponse>;
    loginWithUsername(): Promise<void>;
    loginWithEmail(): Promise<void>;
    logout(): Promise<void>;
    getWebClient(): WebClient;
    getUser(): UserIdentifier;
}
