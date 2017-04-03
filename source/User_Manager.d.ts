/// <reference types="sequelize" />
/// <reference types="express" />
/// <reference types="es6-promise" />
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
import * as Sequelize from 'sequelize';
export interface Settings {
    secret: string;
    user?: any;
    cookie?: any;
}
export declare class User_Manager {
    db: Sequelize.Sequelize;
    User_Model: any;
    Session_Model: any;
    constructor(app: express.Application, db: Sequelize.Sequelize, settings: Settings);
    get_user(username: any): Promise<User>;
    create_user(fields: any): Promise<any>;
    create_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_logout_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
    create_all_endpoints(app: any): void;
}
