import * as Sequelize from 'sequelize';
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
export declare class UserManager {
    db: Sequelize.Sequelize;
    User_Model: any;
    user_model: any;
    private sessionCollection;
    private table_keys;
    private tempPasswordCollection;
    private emailVerificationCollection;
    constructor(db: Sequelize.Sequelize, settings: Settings);
    hashPassword(password: any): Promise<string>;
    prepareNewUser(fields: any): Promise<any>;
    prepare_new_user(fields: any): Promise<any>;
    create_user(fields: any, uniqueField?: string | string[]): Promise<any>;
    createUser(fields: any, uniqueField?: string | string[]): Promise<any>;
    getUser(id: any): Promise<User_With_Password>;
    getSessionCollection(): any;
    getUserCollection(): any;
    private validateParameters(request);
    private tempPasswordHasExpired(tempPassword);
    private emailCodeHasExpired(emailCode);
    matchTempPassword(user: any, password: any): Promise<boolean>;
    createTempPassword(username: string): Promise<any>;
    createEmailCode(user: any): Promise<any>;
    verifyEmailCode(userId: any, submittedCode: any): Promise<boolean>;
    getEmailCode(user: any): any;
    getTempPassword(user: any): any;
    private sanitizeRequest(request);
    fieldExists(key: string, value: any): Promise<boolean>;
    checkUniqueness(user: any, field?: string): Promise<void>;
    getTempPasswordCollection(): any;
}
export declare class User_Manager extends UserManager {
    constructor(db: Sequelize.Sequelize, settings: Settings);
}
