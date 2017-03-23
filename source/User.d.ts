interface Role {
    id: number;
    name: string;
}
interface User {
    username: string;
    password: string;
    roles: Role[];
}
interface User_With_Password extends User {
    password: string;
}
