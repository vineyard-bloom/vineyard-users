export interface Role {
    id: number;
    name: string;
}
export interface User {
    id: string;
    username: string;
    two_factor_secret: string;
    two_factor_enabled: boolean;
    roles: Role[];
    [key: string]: any;
}
export interface UserWithPassword extends User {
    password: string;
}
