/// <reference types="express" />
import * as express from 'express';
export interface Settings {
    secret: string;
    user?: any;
}
export declare function initialize(app: express.Application, mongoose_connection: any, settings: Settings): void;
