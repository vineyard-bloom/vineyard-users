interface Role {
    id: number;
    name: string;
}
interface User {
    username: string;
    password: string;
    two_factor_secret: string;
    two_factor_enabled: boolean;
    roles: Role[];
}
interface User_With_Password extends User {
    password: string;
    salt: string;
}
