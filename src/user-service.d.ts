/// <reference types="express" />
import { User_Manager } from "./User_Manager";
import { Request } from 'vineyard-lawn';
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
export interface Service_Settings {
    secret: string;
    cookie?: any;
}
export declare class UserService {
    user_manager: User_Manager;
    constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings);
    private checkTempPassword(user, password);
    checkPassword(password: string, hash: string): Promise<boolean>;
    private checkLogin(request);
    private finishLogin(request, user);
    login(request: Request): any;
    create_login_handler(): lawn.Response_Generator;
    create_login_2fa_handler(): lawn.Response_Generator;
    private verify2faOneTimeCode(request);
    logout(request: Request): Promise<{}>;
    createLogoutHandler(): lawn.Response_Generator;
    create_logout_handler(): lawn.Response_Generator;
    create_get_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    createTempPassword(username: string): Promise<any>;
    create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_logout_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_all_endpoints(app: any): void;
    require_logged_in(request: lawn.Request): void;
    addUserToRequest(request: Request): Promise<User>;
    loadValidationHelpers(ajv: any): void;
    fieldExists(request: Request, fieldOptions: string[]): any;
}
export declare class User_Service extends UserService {
    constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings);
}
