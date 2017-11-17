/// <reference types="express-session" />
import { Store } from 'express-session';
export interface SequelizeStoreConfig {
    expiration: number;
    updateFrequency: number;
    secure: boolean;
}
export interface NewSessionRecord {
    user: string | undefined;
    expires: Date;
}
export interface SessionRecord extends NewSessionRecord {
    sid: string;
}
export interface SequelizeSessionRecord extends SessionRecord {
    dataValues: any;
    destroy: any;
    save: any;
    update: any;
}
export declare type SimpleCallback = (error: Error) => void;
export declare class SequelizeStore extends Store {
    config: SequelizeStoreConfig;
    sessionModel: any;
    expirationCron: any;
    constructor(sessionModel: any, config: SequelizeStoreConfig);
    private deleteExpiredSessions(callback);
    startSessionCron(): void;
    stopSessionCron(): void;
    private determineExpiration(cookie);
    clear: (callback: (err: any) => void) => void;
    destroySession(sid: string, callback: SimpleCallback): void;
    formatCookie(expires: Date): {
        maxAge: number;
        secure: boolean;
        expires: Date;
    };
    get: (sid: string, callback: (err: any, session: Express.Session) => void) => void;
    length: (callback: (err: any, length: number) => void) => void;
    set: (sid: string, data: Express.Session, callback: (err: any, session: Express.Session) => void) => void;
    touchSession(sid: string, data: any, callback: SimpleCallback): void;
}
