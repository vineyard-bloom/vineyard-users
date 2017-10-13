/// <reference types="sequelize" />
import * as Sequelize from 'sequelize';
import { Collection } from "vineyard-ground";
import { User, User_With_Password } from "./User";
export interface Table_Keys {
    id: string;
    username: string;
    password: string;
}
export interface Settings {
    user_model: any;
    table_keys?: any;
    model: any;
}
export interface TempPassword {
    user: string;
    password: string;
    created: any;
}
export interface EmailVerification {
    user: string;
    code: string;
}
export interface Onetimecode {
    id: string;
    user: string;
    code: string;
    available: boolean;
}
export declare class UserManager {
    db: Sequelize.Sequelize;
    User_Model: Collection<User_With_Password>;
    user_model: Collection<User_With_Password>;
    private sessionCollection;
    private table_keys;
    tempPasswordCollection: Collection<TempPassword>;
    private emailVerificationCollection;
    private oneTimeCodeCollection;
    constructor(db: Sequelize.Sequelize, settings: Settings);
    hashPassword(password: string): Promise<string>;
    prepareNewUser(fields: any): Promise<any>;
    prepare_new_user(fields: any): Promise<any>;
    create_user(fields: any, uniqueField?: string | string[]): Promise<any>;
    createUser(fields: any, uniqueField?: string | string[]): Promise<any>;
    getUser(id: {
        id: string;
    } | string): Promise<User_With_Password | undefined>;
    getSessionCollection(): any;
    getUserCollection(): Collection<User_With_Password>;
    getOneTimeCodeCollection(): Collection<Onetimecode>;
    private validateParameters(request);
    private tempPasswordHasExpired(tempPassword);
    private emailCodeHasExpired(emailCode);
    matchTempPassword(user: User, password: string): Promise<boolean>;
    createTempPassword(username: string): Promise<any>;
    createEmailCode(user: User): Promise<any>;
    verifyEmailCode(userId: string, submittedCode: string): Promise<boolean>;
    getEmailCode(user: User): Promise<EmailVerification | undefined>;
    getTempPassword(user: User): Promise<TempPassword | undefined>;
    getUserOneTimeCode(user: User): Promise<Onetimecode | undefined>;
    private sanitizeRequest(request);
    fieldExists(key: string, value: any): Promise<boolean>;
    compareOneTimeCode(oneTimeCode: Onetimecode, codeRecord: Onetimecode | undefined): Promise<boolean>;
    setOneTimeCodeToUnavailable(oneTimeCode: Onetimecode): Promise<Onetimecode>;
    createOneTimeCodeForUser(userId: string): any;
    checkUniqueness(user: User, field?: string): Promise<void>;
    getTempPasswordCollection(): Collection<TempPassword>;
    resetTwoFactor(user: User): Promise<User_With_Password>;
}
export declare class User_Manager extends UserManager {
    constructor(db: Sequelize.Sequelize, settings: Settings);
}
