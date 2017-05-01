"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var session = require('express-session');
var vineyard_lawn_1 = require("vineyard-lawn");
var lawn = require("vineyard-lawn");
var two_factor = require("./two-factor");
var bcrypt = require('bcrypt');
function sanitize(user) {
    var result = Object.assign({}, user);
    delete result.password;
    delete result.salt;
    return result;
}
var User_Service = (function () {
    function User_Service(app, user_manager, settings) {
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
    User_Service.prototype.prepare_new_user = function (fields) {
        var _this = this;
        if (!fields.username)
            throw new vineyard_lawn_1.Bad_Request("Missing username field");
        if (!fields.password)
            throw new vineyard_lawn_1.Bad_Request("Missing password field");
        return this.user_manager.User_Model.first_or_null({ username: fields.username }).select(['id'])
            .then(function (user) {
            if (user)
                throw new vineyard_lawn_1.Bad_Request("That username is already taken.");
            return _this.user_manager.prepare_new_user(fields);
        });
    };
    User_Service.prototype.check_login = function (request) {
        return this.user_manager.User_Model.first({ username: request.data.username })
            .then(function (response) {
            if (!response)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
            return bcrypt.compare(request.data.password, response.password)
                .then(function (success) {
                if (!success)
                    throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
                var user = response;
                request.session.user = user.id;
                return user;
            });
        });
    };
    User_Service.prototype.create_login_handler = function () {
        var _this = this;
        return function (request) { return _this.check_login(request)
            .then(function (user) { return sanitize(user); }); };
    };
    User_Service.prototype.create_login_2fa_handler = function () {
        var _this = this;
        return function (request) { return _this.check_login(request)
            .then(function (user) {
            if (!two_factor.verify_2fa_token(user.two_factor_secret, request.data.token))
                throw new vineyard_lawn_1.Bad_Request("Invalid 2FA token.");
            return sanitize(user);
        }); };
    };
    User_Service.prototype.create_logout_handler = function () {
        return function (request) {
            if (!request.session.user)
                throw new vineyard_lawn_1.Bad_Request('Already logged out.');
            request.session.user = null;
            return Promise.resolve({});
        };
    };
    User_Service.prototype.create_get_user_endpoint = function (app, overrides) {
        var _this = this;
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.get,
            path: "user",
            action: function (request) {
                return _this.user_manager.User_Model.get(request.session.user)
                    .then(function (response) {
                    if (!response)
                        throw new vineyard_lawn_1.Bad_Request('Invalid user id.');
                    var user = response.dataValues;
                    return sanitize(user);
                });
            }
        }, overrides);
    };
    User_Service.prototype.create_login_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/login",
            action: this.create_login_handler()
        }, overrides);
    };
    User_Service.prototype.create_logout_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/logout",
            action: this.create_logout_handler()
        }, overrides);
    };
    User_Service.prototype.create_all_endpoints = function (app) {
        this.create_get_user_endpoint(app);
        this.create_login_endpoint(app);
        this.create_logout_endpoint(app);
    };
    User_Service.prototype.require_logged_in = function (request) {
        if (!request.session.user)
            throw new lawn.Needs_Login();
    };
    return User_Service;
}());
exports.User_Service = User_Service;
//# sourceMappingURL=User_Service.js.map