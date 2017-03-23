/// <reference types="mongoose" />
/// <reference types="express" />
/// <reference types="es6-promise" />
import * as lawn from 'vineyard-lawn';
import * as express from 'express';
import * as mongoose from 'mongoose';
export interface Settings {
    secret: string;
    user?: any;
}
export interface Endpoint_Info {
}
export declare class User_Manager {
    db: mongoose.Connection;
    User_Model: mongoose.Model<any>;
    constructor(app: express.Application, mongoose_connection: mongoose.Connection, settings: Settings);
    get_user(username: any): Promise<User>;
    create_user(fields: any): Promise<any>;
}
export declare function create_user_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
export declare function create_login_endpoint(app: any, overrides?: lawn.Optional_Endpoint_Info): void;
