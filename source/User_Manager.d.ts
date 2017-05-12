/// <reference types="sequelize" />
import * as Sequelize from 'sequelize';
export interface Table_Keys {
    id: string;
    username: string;
    password: string;
}
export interface Settings {
    user_model: any;
    table_keys?: any;
}
export declare class UserManager {
    db: Sequelize.Sequelize;
    User_Model: any;
    user_model: any;
    Session_Model: any;
    table_keys: Table_Keys;
    constructor(db: Sequelize.Sequelize, settings: Settings);
    prepare_new_user(fields: any): any;
    create_user(fields: any): Promise<any>;
    getUser(id: any): Promise<User_With_Password>;
}
export declare class User_Manager extends UserManager {
    constructor(db: Sequelize.Sequelize, settings: Settings);
}
