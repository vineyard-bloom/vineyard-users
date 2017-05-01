/// <reference types="express" />
import { User_Manager } from "./User_Manager";
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
export interface Service_Settings {
    secret: string;
    cookie?: any;
}
export declare class User_Service {
    user_manager: User_Manager;
    constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings);
    prepare_new_user(fields: any): Promise<User>;
    private check_login(request);
    create_login_handler(): lawn.Response_Generator;
    create_login_2fa_handler(): lawn.Response_Generator;
    create_logout_handler(): lawn.Response_Generator;
    create_get_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_logout_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_all_endpoints(app: any): void;
    require_logged_in(request: lawn.Request): void;
}
