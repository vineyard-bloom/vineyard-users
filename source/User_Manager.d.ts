/// <reference types="sequelize" />
/// <reference types="express" />
/// <reference types="es6-promise" />
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
import * as Sequelize from 'sequelize';
export interface Table_Keys {
    id: string;
    username: string;
    password: string;
}
export interface Settings {
    secret: string;
    user_model: any;
    cookie?: any;
    table_keys?: any;
}
export declare class User_Manager {
    db: Sequelize.Sequelize;
    User_Model: any;
    Session_Model: any;
    table_keys: Table_Keys;
    constructor(app: express.Application, db: Sequelize.Sequelize, settings: Settings);
    create_user(fields: any): Promise<any>;
    sanitize(user: User_With_Password): User;
    create_login_handler(): lawn.Response_Generator;
    create_logout_handler(): lawn.Response_Generator;
    create_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_logout_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_all_endpoints(app: any): void;
    require_logged_in(request: lawn.Request): void;
}
