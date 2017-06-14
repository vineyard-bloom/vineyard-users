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
var bcrypt = require('bcrypt');
function sanitize(user) {
    var result = Object.assign({}, user);
    delete result.password;
    return result;
}
var UserService = (function () {
    function UserService(app, user_manager, settings) {
        this.user_manager = user_manager;
        var SequelizeStore = require('connect-session-sequelize')(session.Store);
        app.use(session({
            secret: settings.secret,
            store: new SequelizeStore({
                db: user_manager.db,
                table: 'session',
                extendDefaultFields: function (defaults, session) {
                    return {
                        expires: defaults.expires,
                        user: session.user
                    };
                }
            }),
            cookie: settings.cookie || {},
            resave: false,
            saveUninitialized: true
        }));
    }
    UserService.prototype.checkTempPassword = function (user, password) {
        return this.user_manager.matchTempPassword(user, password)
            .then(function (success) {
            if (!success)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
            return user;
        });
    };
    UserService.prototype.checkLogin = function (request) {
        var _this = this;
        return this.user_manager.User_Model.first({ username: request.data.username })
            .then(function (user) {
            if (!user)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
            return bcrypt.compare(request.data.password, user.password)
                .then(function (success) { return success
                ? user
                : _this.checkTempPassword(user, request.data.password); });
        });
    };
    UserService.prototype.login = function (request, user) {
        request.session.user = user.id;
        return sanitize(user);
    };
    UserService.prototype.create_login_handler = function () {
        var _this = this;
        return function (request) { return _this.checkLogin(request)
            .then(function (user) { return _this.login(request, user); }); };
    };
    UserService.prototype.create_login_2fa_handler = function () {
        var _this = this;
        return function (request) { return _this.checkLogin(request)
            .then(function (user) {
            if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
                throw new vineyard_lawn_1.Bad_Request("Invalid 2FA token.");
            return _this.login(request, user);
        }); };
    };
    UserService.prototype.createLogoutHandler = function () {
        return function (request) {
            if (!request.session.user)
                throw new vineyard_lawn_1.Bad_Request('Already logged out.');
            request.session.user = null;
            return Promise.resolve({});
        };
    };
    UserService.prototype.create_logout_handler = function () {
        return this.createLogoutHandler();
    };
    UserService.prototype.create_get_user_endpoint = function (app, overrides) {
        var _this = this;
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.get,
            path: "user",
            action: function (request) {
                return _this.user_manager.getUser(request.session.user)
                    .then(function (user) {
                    if (!user)
                        throw new vineyard_lawn_1.Bad_Request('Invalid user id.');
                    return sanitize(user);
                });
            }
        }, overrides);
    };
    UserService.prototype.create_login_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/login",
            action: this.create_login_handler()
        }, overrides);
    };
    UserService.prototype.create_logout_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/logout",
            action: this.create_logout_handler()
        }, overrides);
    };
    UserService.prototype.create_all_endpoints = function (app) {
        this.create_get_user_endpoint(app);
        this.create_login_endpoint(app);
        this.create_logout_endpoint(app);
    };
    UserService.prototype.require_logged_in = function (request) {
        if (!request.session.user)
            throw new lawn.Needs_Login();
    };
    UserService.prototype.addUserToRequest = function (request) {
        if (request.user)
            return Promise.resolve(request.user);
        return this.user_manager.getUser(request.session.user)
            .then(function (user) { return request.user = sanitize(user); });
    };
    UserService.prototype.loadValidationHelpers = function (ajv) {
        ajv.addSchema(require('./validation/helpers.json'));
    };
    UserService.prototype.fieldExists = function (request, fieldOptions) {
        var key = request.data.key;
        var value = request.data.value;
        if (fieldOptions.indexOf(key) == -1)
            throw new vineyard_lawn_1.Bad_Request('Invalid user field: "' + key + '"');
        return this.user_manager.fieldExists(key, value)
            .then(function (result) { return ({
            exists: result
        }); });
    };
    return UserService;
}());
exports.UserService = UserService;
var User_Service = (function (_super) {
    __extends(User_Service, _super);
    function User_Service(app, user_manager, settings) {
        return _super.call(this, app, user_manager, settings) || this;
    }
    return User_Service;
}(UserService));
exports.User_Service = User_Service;
//# sourceMappingURL=User_Service.js.map