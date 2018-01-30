import { ResponseGenerator, Method, Request } from "vineyard-lawn";
import { ValidationCompiler } from "vineyard-lawn";
export declare function createTwoFactorSecretResponse(): ResponseGenerator;
export declare function verifyTwoFactorToken(secret: string, token: string): boolean;
export declare function verifyTwoFactorRequest(request: Request): string;
export declare function verifyTwoFactorTokenHandler(): ResponseGenerator;
export declare function getTwoFactorToken(secret: string): any;
export declare class TwoFactorEndpoints {
    private validators;
    constructor(compiler: ValidationCompiler);
    getNewSecret(): {
        method: Method;
        path: string;
        action: ResponseGenerator;
        validator: any;
    };
    verifyToken(): {
        method: Method;
        path: string;
        action: ResponseGenerator;
        validator: any;
    };
    getValidators(): any;
}
export declare function initializeTwoFactor(server: any): {
    validators: any;
};
