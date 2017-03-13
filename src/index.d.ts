/// <reference types="express" />
import * as express from 'express';
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
export declare function initialize(app: express.Application, mongoose_connection: any, settings: Settings): void;
