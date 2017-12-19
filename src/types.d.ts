export interface Role {
    id: number;
    name: string;
}
export interface BaseUser {
    id: string;
    email: string;
    twoFactorSecret: string;
    twoFactorEnabled: boolean;
    [key: string]: any;
}
export interface UserWithRoles extends BaseUser {
    roles: Role[];
}
export interface UserWithUsername extends BaseUser {
    username: string;
}
export interface UserWithPassword extends UserWithUsername {
    password: string;
}
