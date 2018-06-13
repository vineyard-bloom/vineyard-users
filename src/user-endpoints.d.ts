import { EndpointInfo } from 'vineyard-lawn';
import { UserService, UserManager } from '.';
import { ValidateFunction } from 'ajv';
export declare type UserEndpointGenerator = {
    loginWithUsernameOrEmail: (path?: string) => EndpointInfo;
    login2faWithBackup: (path?: string) => EndpointInfo;
    logout: (path?: string) => EndpointInfo;
};
export declare type UserEndpointValidators = {
    loginWithUsername: ValidateFunction;
    login2faWithBackup: ValidateFunction;
    empty: ValidateFunction;
};
export declare function createUserEndpointGenerator(userManager: UserManager, userService: UserService, validators: UserEndpointValidators): UserEndpointGenerator;
