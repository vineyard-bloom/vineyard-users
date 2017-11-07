/// <reference types="express" />
import { UserManager } from "./user-manager";
import { Request } from 'vineyard-lawn';
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
import { User, UserWithPassword } from "./User";
import { SequelizeStore } from "./session-store";
export interface ServiceSettings {
    secret: string;
    cookie: any;
    rolling?: true;
}
export declare type Service_Settings = ServiceSettings;
export declare function createDefaultSessionStore(userManager: UserManager, expiration: number): SequelizeStore;
export declare class UserService {
    private userManager;
    private user_manager;
    constructor(app: express.Application, userManager: UserManager, settings: ServiceSettings, sessionStore?: any);
    checkTempPassword(user: User, password: string): Promise<User>;
    checkPassword(password: string, hash: string): Promise<boolean>;
    private _checkLogin(filter, password);
    checkUsernameOrEmailLogin(request: Request): Promise<UserWithPassword>;
    checkEmailLogin(request: Request): Promise<UserWithPassword>;
    finishLogin(request: Request, user: UserWithPassword): User;
    login(request: Request): Promise<User>;
    create_login_handler(): lawn.Response_Generator;
    checkTwoFactor(user: User, request: Request): void;
    create_login_2fa_handler(): lawn.Response_Generator;
    createLogin2faHandlerWithBackup(): lawn.Response_Generator;
    verify2faOneTimeCode(request: Request, user: User): Promise<boolean>;
    logout(request: Request): Promise<{}>;
    createLogoutHandler(): lawn.Response_Generator;
    create_logout_handler(): lawn.Response_Generator;
    create_get_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    createTempPassword(username: string): Promise<any>;
    create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_logout_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_all_endpoints(app: any): void;
    require_logged_in(request: lawn.Request): void;
    addUserToRequest(request: Request): Promise<User | undefined>;
    loadValidationHelpers(ajv: any): void;
    fieldExists(request: Request, fieldOptions: string[]): Promise<{
        exists: boolean;
    }>;
}
export declare class User_Service extends UserService {
    constructor(app: express.Application, UserManager: UserManager, settings: ServiceSettings);
}
