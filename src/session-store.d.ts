export interface SequelizeStoreOptions {
    expiration: number;
    updateFrequency: number;
}
export interface NewSessionRecord {
    user: string | undefined;
    expires: Date;
}
export interface SessionRecord extends NewSessionRecord {
    sid: string;
}
export interface SequelizeSessionRecord extends SessionRecord {
    destroy: any;
    save: any;
}
export interface ExpressCookie {
    expires: Date;
}
export interface ExpressSession {
    cookie: ExpressCookie;
}
export declare type SimpleCallback = (error: Error) => void;
export declare class SequelizeStore {
    options: SequelizeStoreOptions;
    sessionModel: any;
    expirationCron: any;
    constructor(sessionModel: any, options: SequelizeStoreOptions);
    private deleteExpiredSessions(callback);
    startSessionCron(): void;
    stopSessionCron(): void;
    private determineExpiration(cookie);
    clear(callback: SimpleCallback): any;
    destroySession(sid: string, callback: SimpleCallback): any;
    get(sid: string, callback: (error: Error, session: any) => void): Promise<SessionRecord | undefined>;
    length(callback: SimpleCallback): any;
    set(sid: string, data: ExpressSession, callback: SimpleCallback): Promise<any>;
    touchSession(sid: string, data: ExpressSession, callback: SimpleCallback): any;
}
