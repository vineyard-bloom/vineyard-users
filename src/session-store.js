"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require('debug')('vineyard-session-store');
var SequelizeStore = (function () {
    function SequelizeStore(sessionModel, options) {
        this.sessionModel = sessionModel;
        this.options = options;
        this.startSessionCron();
    }
    SequelizeStore.prototype.deleteExpiredSessions = function (callback) {
        debug('CLEARING EXPIRED SESSIONS');
        return this.sessionModel.destroy({ where: { expires: { lt: new Date() } } }).asCallback(callback);
    };
    SequelizeStore.prototype.startSessionCron = function () {
        var _this = this;
        this.stopSessionCron();
        if (this.options.updateFrequency > 0) {
            this.expirationCron = setInterval(function (callback) { return _this.deleteExpiredSessions(callback); }, this.options.updateFrequency);
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
            : new Date(Date.now() + this.options.expiration);
    };
    // Session Interface Implementation
    SequelizeStore.prototype.clear = function (callback) {
        return this.sessionModel.destroy({
            where: {},
            truncate: true
        }).asCallback(callback);
    };
    SequelizeStore.prototype.destroySession = function (sid, callback) {
        debug('Deleting %s', sid);
        return this.sessionModel.find({ where: { sid: sid } })
            .then(function (session) {
            if (!session) {
                debug('Could not find session %s', sid);
                return null;
            }
            return session.destroy();
        }).asCallback(callback);
    };
    SequelizeStore.prototype.get = function (sid, callback) {
        debug('Get "%s"', sid);
        return this.sessionModel.find({ where: { sid: sid } })
            .then(function (session) {
            if (!session) {
                debug('No session with id %s', sid);
                return undefined;
            }
            debug('Found %s', session.sid);
            return {
                user: session.user
            };
        }).asCallback(callback);
    };
    SequelizeStore.prototype.length = function (callback) {
        return this.sessionModel.count().asCallback(callback);
    };
    SequelizeStore.prototype.set = function (sid, data, callback) {
        debug('INSERT "%s"', sid);
        var expires = this.determineExpiration(data.cookie);
        var defaults = {
            user: undefined,
            expires: expires
        };
        var values = Object.assign({}, defaults, data);
        return this.sessionModel.findCreateFind({
            where: { 'sid': sid },
            defaults: values
        }).spread(function sessionCreated(existingSession) {
            var changed = false;
            if (existingSession.user != values.user) {
                existingSession.user = values.user;
                changed = true;
            }
            if (changed) {
                existingSession.expires = expires;
                return existingSession.save().return(existingSession);
            }
            return existingSession;
        }).asCallback(callback);
    };
    SequelizeStore.prototype.touchSession = function (sid, data, callback) {
        debug('TOUCH "%s"', sid);
        var expires = this.determineExpiration(data.cookie);
        return this.sessionModel.update({ expires: expires }, { where: { sid: sid } })
            .then(function (rows) { return rows; }).asCallback(callback);
    };
    return SequelizeStore;
}());
exports.SequelizeStore = SequelizeStore;
//# sourceMappingURL=session-store.js.map