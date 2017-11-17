"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var session = require('express-session');
var vineyard_lawn_1 = require("vineyard-lawn");
var lawn = require("vineyard-lawn");
var two_factor = require("./two-factor");
var session_store_1 = require("./session-store");
var bcrypt = require('bcrypt');
function sanitize(user) {
    var result = Object.assign({}, user);
    delete result.password;
    delete result.two_factor_secret;
    return result;
}
function createDefaultSessionStore(userManager, expiration, secure) {
    return new session_store_1.SequelizeStore(userManager.getSessionCollection().getTableClient().getSequelizeModel(), {
        expiration: expiration,
        updateFrequency: 5 * 60 * 1000,
        secure: secure,
    });
}
exports.createDefaultSessionStore = createDefaultSessionStore;
var UserService = /** @class */ (function () {
    function UserService(app, userManager, cookie, sessionStore) {
        if (sessionStore === void 0) { sessionStore = createDefaultSessionStore(userManager, cookie.maxAge, cookie.secure); }
        var _this = this;
        this.userManager = this.user_manager = userManager;
        if (!cookie.secret)
            throw new Error("UserService settings.secret cannot be empty.");
        app.use(session({
            secret: cookie.secret,
            store: sessionStore,
            cookie: cookie,
            resave: false,
            saveUninitialized: true
        }));
        // Backwards compatibility
        var self = this;
        self.login = function () {
            return function (request) { return _this.loginWithUsername(request); };
        };
        self.create_login_handler = function () {
            return function (request) { return _this.loginWithUsername(request); };
        };
        self.create_login_2fa_handler = function () {
            return function (request) { return _this.checkUsernameOrEmailLogin(request)
                .then(function (user) {
                _this.checkTwoFactor(user, request);
                return _this.finishLogin(request, user);
            }); };
        };
        self.createLogin2faHandlerWithBackup = function () {
            return function (request) { return _this.login2faWithBackup(request); };
        };
        self.createLogoutHandler = function () {
            return function (request) { return _this.logout(request); };
        };
        self.create_logout_handler = function () {
            return self.createLogoutHandler();
        };
    }
    UserService.prototype._checkLogin = function (filter, password) {
        var _this = this;
        return this.userManager.getUserModel().first(filter)
            .then(function (user) {
            if (!user)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.', { key: 'invalid-credentials' });
            return bcrypt.compare(password, user.password)
                .then(function (success) { return success
                ? user
                : _this.checkTempPassword(user, password); });
        });
    };
    UserService.prototype.checkTempPassword = function (user, password) {
        return this.userManager.matchTempPassword(user, password)
            .then(function (success) {
            if (!success)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.', { key: 'invalid-credentials' });
            return user;
        });
    };
    UserService.prototype.checkPassword = function (password, hash) {
        return bcrypt.compare(password, hash);
    };
    UserService.prototype.checkUsernameOrEmailLogin = function (request) {
        var data = request.data;
        var filter = data.username
            ? { username: data.username }
            : { email: data.email };
        return this._checkLogin(filter, data.password);
    };
    UserService.prototype.checkEmailLogin = function (request) {
        var data = request.data;
        return this._checkLogin({ email: data.email }, data.password);
    };
    UserService.prototype.finishLogin = function (request, user) {
        request.session.user = user.id;
        return sanitize(user);
    };
    UserService.prototype.loginWithUsername = function (request) {
        var _this = this;
        return this.checkUsernameOrEmailLogin(request)
            .then(function (user) { return _this.finishLogin(request, user); });
    };
    UserService.prototype.checkTwoFactor = function (user, request) {
        if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
            throw new vineyard_lawn_1.Bad_Request('Invalid Two Factor Authentication code.', { key: "invalid-2fa" });
    };
    UserService.prototype.login2faWithBackup = function (request) {
        var _this = this;
        return this.checkUsernameOrEmailLogin(request)
            .then(function (user) {
            var currentUser = user;
            if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
                return _this.verify2faOneTimeCode(request, currentUser).then(function (backupCodeCheck) {
                    if (!backupCodeCheck)
                        throw new vineyard_lawn_1.Bad_Request('Invalid Two Factor Authentication code.', { key: "invalid-2fa" });
                    return _this.finishLogin(request, currentUser);
                });
            return _this.finishLogin(request, currentUser);
        });
    };
    UserService.prototype.verify2faOneTimeCode = function (request, user) {
        var _this = this;
        return this.userManager.getUserOneTimeCode(user).then(function (code) {
            if (!code) {
                return false;
            }
            return _this.userManager.compareOneTimeCode(request.data.twoFactor, code).then(function (pass) {
                if (!pass) {
                    return false;
                }
                return _this.userManager.setOneTimeCodeToUnavailable(code)
                    .then(function () {
                    request.session.oneTimeCodeUsed = true;
                    return true;
                });
            });
        });
    };
    UserService.prototype.logout = function (request) {
        if (!request.session.user)
            throw new vineyard_lawn_1.BadRequest('Already logged out.', { key: 'already-logged-out' });
        request.session.user = null;
        return Promise.resolve({});
    };
    UserService.prototype.createTempPassword = function (username) {
        var _this = this;
        return this.userManager.getUserModel().first({ username: username })
            .then(function (user) {
            if (!user)
                throw new vineyard_lawn_1.BadRequest("Invalid username", {
                    key: "invalid-username",
                    data: { username: username }
                });
            return _this.userManager.getTempPassword(user)
                .then(function (tempPassword) {
                if (!tempPassword) {
                    var passwordString_1 = Math.random().toString(36).slice(2);
                    return _this.userManager.hashPassword(passwordString_1)
                        .then(function (hashedPassword) { return _this.userManager.getTempPasswordCollection().create({
                        user: user,
                        password: hashedPassword
                    }); })
                        .then(function () {
                        return {
                            tempPassword: passwordString_1,
                            user: user
                        };
                    });
                }
                else {
                    throw new vineyard_lawn_1.BadRequest("A temporary password has already been created. Please try again at a later time.", {
                        key: 'existing-temp-pass'
                    });
                }
            });
        });
    };
    UserService.prototype.require_logged_in = function (request) {
        if (!request.session.user)
            throw new lawn.Needs_Login();
    };
    UserService.prototype.getSanitizedUser = function (id) {
        return this.getModel()
            .getUser(id)
            .then(sanitize);
    };
    UserService.prototype.addUserToRequest = function (request) {
        if (request.user)
            return Promise.resolve(request.user);
        return this.userManager.getUser(request.session.user)
            .then(function (user) {
            if (user)
                return request.user = sanitize(user);
            else
                return undefined;
        });
    };
    UserService.prototype.loadValidationHelpers = function (ajv) {
        ajv.addSchema(require('./validation/helpers.json'));
    };
    UserService.prototype.fieldExists = function (request, fieldOptions) {
        var keyName = request.data.key;
        var value = request.data.value;
        if (fieldOptions.indexOf(keyName) == -1)
            throw new vineyard_lawn_1.Bad_Request('Invalid user field', {
                key: 'invalid-user-field',
                data: { field: keyName }
            });
        return this.userManager.fieldExists(keyName, value)
            .then(function (result) { return ({
            exists: result
        }); });
    };
    UserService.prototype.getModel = function () {
        return this.userManager;
    };
    return UserService;
}());
exports.UserService = UserService;
var User_Service = /** @class */ (function (_super) {
    __extends(User_Service, _super);
    function User_Service(app, UserManager, settings) {
        return _super.call(this, app, UserManager, settings) || this;
    }
    return User_Service;
}(UserService));
exports.User_Service = User_Service;
//# sourceMappingURL=user-service.js.map