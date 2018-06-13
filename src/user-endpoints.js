"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vineyard_lawn_1 = require("vineyard-lawn");
function createUserEndpointGenerator(userManager, userService, validators) {
    return {
        loginWithUsernameOrEmail: (path = 'user/login') => createLoginWithUsernameOrEmailEndpoint(userService, path, validators),
        login2faWithBackup: (path = 'user/login') => createLoginWith2faBackupEndpoint(userService, path, validators),
        logout: (path = 'user/logout') => createLogoutEndpoint(userService, path, validators),
    };
}
exports.createUserEndpointGenerator = createUserEndpointGenerator;
function createLoginWithUsernameOrEmailEndpoint(userService, path, validators) {
    return {
        method: vineyard_lawn_1.Method.post,
        path: path,
        action: userService.loginWithUsernameOrEmail,
        validators: validators.loginWithUsername
    };
}
function createLoginWith2faBackupEndpoint(userService, path, validators) {
    return {
        method: vineyard_lawn_1.Method.post,
        path: path,
        action: userService.login2faWithBackup,
        validators: validators.login2faWithBackup
    };
}
function createLogoutEndpoint(userService, path, validators) {
    return {
        method: vineyard_lawn_1.Method.post,
        path: path,
        action: userService.logout,
        validators: validators.logout
    };
}
//# sourceMappingURL=user-endpoints.js.map