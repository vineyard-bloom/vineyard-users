import { Response_Generator, Request } from "vineyard-lawn";
export declare function get_2fa_token(): Response_Generator;
export declare function verify_2fa_token(secret: any, token: any): boolean;
export declare function verify_2fa_request(request: Request): string;
export declare function verify_2fa_token_handler(): Response_Generator;
export declare function verify_token_and_save(user_model: any): Response_Generator;
export declare function getTwoFactorToken(secret: string): any;
export declare function initializeTwoFactor(server: any): {
    validators: any;
};
