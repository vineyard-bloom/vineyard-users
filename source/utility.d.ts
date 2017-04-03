export declare type Role_Id_Parameter = Role | number;
export declare function has_role(user: User, role: Role_Id_Parameter): boolean;
export declare function has_any_role(user: User, roles: Role_Id_Parameter[]): boolean;
