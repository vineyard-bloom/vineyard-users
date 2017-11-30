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
var debug = require('debug')('vineyard-session-store');
var express_session_1 = require("express-session");
var SequelizeStore = (function (_super) {
    __extends(SequelizeStore, _super);
    function SequelizeStore(sessionModel, config) {
        var _this = _super.call(this) || this;
        // Session Interface Implementation
        _this.clear = function (callback) {
            _this.sessionModel.destroy({
                where: {},
                truncate: true
            }).asCallback(callback);
        };
        _this.get = function (sid, callback) {
            debug('GET "%s"', sid);
            _this.sessionModel.find({ where: { sid: sid } })
                .then(function (session) {
                if (!session) {
                    debug('No session with id %s', sid);
                    return undefined;
                }
                debug('FOUND %s', session.sid);
                return {
                    user: session.user,
                    cookie: _this.formatCookie(session.expires)
                };
            }).asCallback(callback);
        };
        _this.length = function (callback) {
            _this.sessionModel.count().asCallback(callback);
        };
        _this.set = function (sid, data, callback) {
            debug('INSERT "%s"', sid);
            var expires = _this.determineExpiration(data.cookie);
            var defaults = {
                user: undefined,
                expires: expires
            };
            var values = Object.assign({}, defaults, data);
            _this.sessionModel.findCreateFind({
                where: { 'sid': sid },
                defaults: values
            }).spread(function (existingRecord) {
                var existingSession = existingRecord.dataValues;
                if (existingSession.user != values.user) {
                    existingSession.user = values.user;
                    existingSession.expires = expires;
                    existingSession.cookie = _this.formatCookie(existingSession.expires);
                    var sql = "\n        UPDATE sessions\n        SET \"user\" = :user\n        WHERE sid = :sid";
                    return _this.sessionModel.sequelize.query(sql, {
                        replacements: {
                            sid: sid,
                            user: values.user
                        }
                    });
                }
                existingSession.cookie = _this.formatCookie(existingSession.expires);
                return existingSession;
            }).asCallback(callback);
        };
        _this.sessionModel = sessionModel;
        if (typeof config.expiration != 'number')
            throw new Error("Cookie expiration must be set to a number of milliseconds.");
        _this.config = config;
        _this.startSessionCron();
        return _this;
    }
    SequelizeStore.prototype.deleteExpiredSessions = function (callback) {
        debug('CLEARING EXPIRED SESSIONS');
        return this.sessionModel.destroy({ where: { expires: { lt: new Date() } } }).asCallback(callback);
    };
    SequelizeStore.prototype.startSessionCron = function () {
        var _this = this;
        this.stopSessionCron();
        if (this.config.updateFrequency > 0) {
            this.expirationCron = setInterval(function (callback) { return _this.deleteExpiredSessions(callback); }, this.config.updateFrequency);
        }
    };
    SequelizeStore.prototype.stopSessionCron = function () {
        if (this.expirationCron) {
            clearInterval(this.expirationCron);
            this.expirationCron = undefined;
        }
    };
    SequelizeStore.prototype.determineExpiration = function (cookie) {
        return cookie && cookie.expires
            ? cookie.expires
            : new Date(Date.now() + this.config.expiration);
    };
    SequelizeStore.prototype.destroySession = function (sid, callback) {
        debug('Deleting %s', sid);
        this.sessionModel.find({ where: { sid: sid } })
            .then(function (session) {
            if (!session) {
                debug('Could not find session %s', sid);
                return null;
            }
            return session.destroy();
        }).asCallback(callback);
    };
    SequelizeStore.prototype.formatCookie = function (expires) {
        return {
            maxAge: this.config.expiration,
            secure: this.config.secure || false,
            expires: expires
        };
    };
    SequelizeStore.prototype.touchSession = function (sid, data, callback) {
        debug('TOUCH "%s"', sid);
        var expires = this.determineExpiration(data.cookie);
        this.sessionModel.update({ expires: expires }, { where: { sid: sid } })
            .then(function (rows) { return rows; }).asCallback(callback);
    };
    return SequelizeStore;
}(express_session_1.Store));
exports.SequelizeStore = SequelizeStore;
//# sourceMappingURL=session-store.js.map