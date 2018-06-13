import { EndpointInfo } from 'vineyard-lawn';
import { UserService, UserManager } from '.';
export declare type UserEndpointGenerator = {
    loginWithUsernameOrEmail: (path?: string) => EndpointInfo;
    login2faWithBackup: (path?: string) => EndpointInfo;
    logout: (path?: string) => EndpointInfo;
};
export declare function createUserEndpointGenerator(userManager: UserManager, userService: UserService, validators: any): UserEndpointGenerator;
