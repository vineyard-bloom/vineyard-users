"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vineyard_lawn_1 = require("vineyard-lawn");
var speakeasy = require("speakeasy");
var window = 2;
function get_2fa_token() {
    return function (request) {
        var secret = speakeasy.generateSecret();
        request.session.two_factor_secret = secret.base32;
        return Promise.resolve({
            secret: secret.base32,
            secret_url: secret.otpauth_url // deprecated
        });
    };
}
exports.get_2fa_token = get_2fa_token;
function verify_2fa_token(secret, token) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window
    });
}
exports.verify_2fa_token = verify_2fa_token;
function verify_2fa_request(request) {
    var two_factor_secret = request.data.twoFactorSecret || request.session.two_factor_secret;
    if (!two_factor_secret)
        throw new vineyard_lawn_1.Bad_Request("2FA secret must be generated before verifying a token.");
    if (verify_2fa_token(two_factor_secret, request.data.twoFactorToken || request.data.twoFactor)) {
        return two_factor_secret;
    }
    throw new vineyard_lawn_1.Bad_Request("Verification failed.");
}
exports.verify_2fa_request = verify_2fa_request;
function verify_2fa_token_handler() {
    return function (request) {
        verify_2fa_request(request);
        return Promise.resolve({
            message: "Verification succeeded."
        });
    };
}
exports.verify_2fa_token_handler = verify_2fa_token_handler;
function verify_token_and_save(user_model) {
    return function (request) {
        var secret = verify_2fa_request(request);
        return user_model.update(request.session.user, {
            two_factor_enabled: true,
            two_factor_secret: request.session.two_factor_secret
        });
    };
}
exports.verify_token_and_save = verify_token_and_save;
function getTwoFactorToken(secret) {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
}
exports.getTwoFactorToken = getTwoFactorToken;
function initializeTwoFactor(server) {
    var validators = server.compileApiSchema(require('./validation/two-factor.json'));
    server.createPublicEndpoints([
        {
            method: vineyard_lawn_1.Method.get,
            path: "user/2fa",
            action: get_2fa_token()
        },
        {
            method: vineyard_lawn_1.Method.post,
            path: "user/2fa",
            action: verify_2fa_token_handler(),
            validator: validators.verifyTwoFactor
        },
    ]);
    return { validators: validators };
}
exports.initializeTwoFactor = initializeTwoFactor;
//# sourceMappingURL=two-factor.js.map