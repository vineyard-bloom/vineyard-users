"use strict";
var session = require('express-session');
var vineyard_lawn_1 = require('vineyard-lawn');
var lawn = require('vineyard-lawn');
var Sequelize = require('sequelize');
var User_Manager = (function () {
    function User_Manager(app, db, settings) {
        this.db = db;
        var SequelizeStore = require('connect-session-sequelize')(session.Store);
        var user_fields = settings.user || {};
        user_fields.username = {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        };
        user_fields.password = {
            type: Sequelize.STRING,
            allowNull: false
        };
        this.User_Model = this.db.define('user', user_fields, {
            underscored: true,
            createdAt: 'created',
            updatedAt: 'modified',
        });
        this.Session_Model = db.define('session', {
            sid: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            user: Sequelize.INTEGER,
            expires: Sequelize.DATE,
            data: Sequelize.TEXT
        }, {
            underscored: true,
            createdAt: 'created',
            updatedAt: 'modified',
        });
        app.use(session({
            secret: settings.secret,
            store: new SequelizeStore({
                db: db,
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
            saveUninitialized: false
        }));
    }
    User_Manager.prototype.get_user = function (username) {
        var _this = this;
        return new Promise(function (resolve, reject) { return _this.User_Model.findOne({ username: username }); })
            .then(function (user) {
            if (user) {
                delete user.password;
            }
            return user;
        });
    };
    User_Manager.prototype.create_user = function (fields) {
        return this.User_Model.create(fields);
    };
    User_Manager.prototype.create_user_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.get,
            path: "user",
            action: function (request) {
                return Promise.resolve({});
            }
        }, overrides);
    };
    User_Manager.prototype.create_login_endpoint = function (app, overrides) {
        var _this = this;
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/login",
            action: function (request) {
                return _this.User_Model.findOne({
                    where: {
                        username: request.data.username,
                        password: request.data.password
                    }
                })
                    .then(function (response) {
                    if (!response)
                        throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
                    var user = response.dataValues;
                    request.session.user = user.id;
                    delete user.password;
                    return user;
                });
            }
        }, overrides);
    };
    User_Manager.prototype.create_logout_endpoint = function (app, overrides) {
        if (overrides === void 0) { overrides = {}; }
        lawn.create_endpoint_with_defaults(app, {
            method: vineyard_lawn_1.Method.post,
            path: "user/logout",
            action: function (request) {
                if (!request.session.user)
                    throw new vineyard_lawn_1.Bad_Request('Already logged out.');
                request.session.user = null;
                return Promise.resolve({});
            }
        }, overrides);
    };
    User_Manager.prototype.create_all_endpoints = function (app) {
        this.create_user_endpoint(app);
        this.create_login_endpoint(app);
        this.create_logout_endpoint(app);
    };
    return User_Manager;
}());
exports.User_Manager = User_Manager;
//# sourceMappingURL=User_Manager.js.map