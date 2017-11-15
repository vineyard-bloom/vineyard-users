import { Response_Generator, Method, Request } from "vineyard-lawn";
import { ValidationCompiler } from "vineyard-lawn";
export declare function get_2fa_token(): Response_Generator;
export declare function verify_2fa_token(secret: string, token: string): boolean;
export declare function verify_2fa_request(request: Request): string;
export declare function verify_2fa_token_handler(): Response_Generator;
export declare function verify_token_and_save(user_model: any): Response_Generator;
export declare function getTwoFactorToken(secret: string): any;
export declare class TwoFactorEndpoints {
    private validators;
    constructor(compiler: ValidationCompiler);
    getNewSecret(): {
        method: Method;
        path: string;
        action: Response_Generator;
        validator: any;
    };
    verifyToken(): {
        method: Method;
        path: string;
        action: Response_Generator;
        validator: any;
    };
    getValidators(): any;
}
export declare function initializeTwoFactor(server: any): {
    validators: any;
};
