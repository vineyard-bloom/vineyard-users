import { Role, UserWithUsername } from "./types";
export declare type Role_Id_Parameter = Role | number;
export declare function has_role(user: UserWithUsername, role: Role_Id_Parameter): boolean;
export declare function has_any_role(user: UserWithUsername, roles: Role_Id_Parameter[]): boolean;
export declare function promiseEach(items: any[], action: any): any;
