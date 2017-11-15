/// <reference types="express" />
import { UserManager } from "./user-manager";
import { Request } from 'vineyard-lawn';
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
import { User, UserWithPassword } from "./User";
import { SequelizeStore } from "./session-store";
export interface CookieSettings {
    secret: string;
    maxAge: number;
    rolling?: boolean;
    secure: boolean;
}
export declare type Service_Settings = CookieSettings;
export declare function createDefaultSessionStore(userManager: UserManager, expiration: number, secure: boolean): SequelizeStore;
export declare class UserService {
    private userManager;
    private user_manager;
    constructor(app: express.Application, userManager: UserManager, cookie: CookieSettings, sessionStore?: any);
    private _checkLogin(filter, password);
    checkTempPassword(user: User, password: string): Promise<User>;
    checkPassword(password: string, hash: string): Promise<boolean>;
    checkUsernameOrEmailLogin(request: Request): Promise<UserWithPassword>;
    checkEmailLogin(request: Request): Promise<UserWithPassword>;
    finishLogin(request: Request, user: UserWithPassword): User;
    loginWithUsername(request: Request): Promise<User>;
    checkTwoFactor(user: User, request: Request): void;
    login2faWithBackup(request: Request): Promise<User>;
    verify2faOneTimeCode(request: Request, user: User): Promise<boolean>;
    logout(request: Request): Promise<{}>;
    createTempPassword(username: string): Promise<any>;
    require_logged_in(request: lawn.Request): void;
    getSanitizedUser(id: string): Promise<User>;
    addUserToRequest(request: Request): Promise<User | undefined>;
    loadValidationHelpers(ajv: any): void;
    fieldExists(request: Request, fieldOptions: string[]): Promise<{
        exists: boolean;
    }>;
    getModel(): UserManager;
}
export declare class User_Service extends UserService {
    constructor(app: express.Application, UserManager: UserManager, settings: CookieSettings);
}
