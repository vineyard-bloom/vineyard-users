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
var Sequelize = require("sequelize");
var two_factor = require("./two-factor");
var bcrypt = require('bcrypt');
var UserManager = (function () {
    function UserManager(db, settings) {
        this.db = db;
        if (!settings)
            throw new Error("Missing settings argument.");
        if (!settings.user_model)
            throw new Error("Missing user_model settings argument.");
        this.table_keys = settings.table_keys || {
            id: "id",
            username: "username,",
            password: "password"
        };
        this.User_Model = this.user_model = settings.user_model;
        this.Session_Model = db.define('session', {
            sid: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            user: Sequelize.UUID,
            expires: Sequelize.DATE,
            data: Sequelize.TEXT
        }, {
            underscored: true,
            createdAt: 'created',
            updatedAt: 'modified',
        });
    }
    UserManager.prototype.prepare_new_user = function (fields) {
        return bcrypt.hash(fields.password, 10)
            .then(function (salt_and_hash) {
            fields.password = salt_and_hash;
            return fields;
        });
    };
    UserManager.prototype.create_user = function (fields) {
        var _this = this;
        return this.prepare_new_user(fields)
            .then(function (user) { return _this.User_Model.create(fields); });
    };
    UserManager.prototype.create_user_with_2fa = function (request) {
        var _this = this;
        var fields = request.data;
        return this.prepare_new_user(fields)
            .then(function (user) {
            fields.two_factor_secret = two_factor.verify_2fa_request(request);
            fields.two_factor_enabled = true;
            delete fields.token;
            return _this.User_Model.create(fields);
        });
    };
    return UserManager;
}());
exports.UserManager = UserManager;
var User_Manager = (function (_super) {
    __extends(User_Manager, _super);
    function User_Manager(db, settings) {
        return _super.call(this, db, settings) || this;
    }
    return User_Manager;
}(UserManager));
exports.User_Manager = User_Manager;
//# sourceMappingURL=User_Manager.js.map