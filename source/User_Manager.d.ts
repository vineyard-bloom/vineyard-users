/// <reference types="mongoose" />
/// <reference types="express" />
/// <reference types="es6-promise" />
import * as express from 'express';
import * as mongoose from 'mongoose';
export interface Settings {
    secret: string;
    user?: any;
}
export interface User_Info {
    username: string;
}
export interface User_Info_With_Password extends User_Info {
    password: string;
}
export declare class User_Manager {
    db: mongoose.Connection;
    User: mongoose.Model<any>;
    authenticate_middleware: any;
    constructor(app: express.Application, mongoose_connection: mongoose.Connection, settings: Settings);
    get_user(username: any): Promise<User_Info>;
    initialize_endpoints(app: any): void;
    get_authenticate_middleware(): any;
    create_user(fields: any): Promise<any>;
}
