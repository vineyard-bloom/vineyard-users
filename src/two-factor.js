"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vineyard_lawn_1 = require("vineyard-lawn");
var speakeasy = require("speakeasy");
var window = 2;
function createTwoFactorSecretResponse() {
    return function (request) {
        var secret = speakeasy.generateSecret();
        return Promise.resolve({
            secret: secret.base32,
            secret_url: secret.otpauth_url // deprecated
        });
    };
}
exports.createTwoFactorSecretResponse = createTwoFactorSecretResponse;
module.exports.get_2fa_token = createTwoFactorSecretResponse;
function verifyTwoFactorToken(secret, token) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window
    });
}
exports.verifyTwoFactorToken = verifyTwoFactorToken;
module.exports.verify_2fa_token = verifyTwoFactorToken;
function verifyTwoFactorRequest(request) {
    var twoFactorSecret = request.data.twoFactorSecret;
    if (!twoFactorSecret)
        throw new vineyard_lawn_1.Bad_Request("Two Factor secret must be generated before verifying.", { key: "no-2-fa" });
    if (verifyTwoFactorToken(twoFactorSecret, request.data.twoFactorToken || request.data.twoFactor)) {
        return twoFactorSecret;
    }
    throw new vineyard_lawn_1.Bad_Request("Invalid Two Factor secret.", { key: "invalid-2fa" });
}
exports.verifyTwoFactorRequest = verifyTwoFactorRequest;
module.exports.verify_2fa_request = verifyTwoFactorRequest;
function verifyTwoFactorTokenHandler() {
    return function (request) {
        verifyTwoFactorRequest(request);
        return Promise.resolve({
            message: "Verification succeeded."
        });
    };
}
exports.verifyTwoFactorTokenHandler = verifyTwoFactorTokenHandler;
module.exports.verify_2fa_token_handler = verifyTwoFactorTokenHandler;
function getTwoFactorToken(secret) {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
}
exports.getTwoFactorToken = getTwoFactorToken;
var TwoFactorEndpoints = (function () {
    function TwoFactorEndpoints(compiler) {
        this.validators = compiler.compileApiSchema(require('./validation/two-factor.json'));
    }
    TwoFactorEndpoints.prototype.getNewSecret = function () {
        return {
            method: vineyard_lawn_1.Method.get,
            path: "user/2fa",
            action: createTwoFactorSecretResponse(),
            validator: this.validators.empty
        };
    };
    TwoFactorEndpoints.prototype.verifyToken = function () {
        return {
            method: vineyard_lawn_1.Method.post,
            path: "user/2fa",
            action: verifyTwoFactorTokenHandler(),
            validator: this.validators.verifyTwoFactor
        };
    };
    TwoFactorEndpoints.prototype.getValidators = function () {
        return this.validators;
    };
    return TwoFactorEndpoints;
}());
exports.TwoFactorEndpoints = TwoFactorEndpoints;
function initializeTwoFactor(server) {
    var endpoints = new TwoFactorEndpoints(server);
    server.createPublicEndpoints([
        endpoints.getNewSecret(),
        endpoints.verifyToken(),
    ]);
    return { validators: endpoints.getValidators() };
}
exports.initializeTwoFactor = initializeTwoFactor;
//# sourceMappingURL=two-factor.js.map