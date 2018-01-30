"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('vineyard-session-store');
const express_session_1 = require("express-session");
class SequelizeStore extends express_session_1.Store {
    constructor(sessionModel, config) {
        super();
        // Session Interface Implementation
        this.clear = (callback) => {
            this.sessionModel.destroy({
                where: {},
                truncate: true
            }).asCallback(callback);
        };
        this.destroy = (sid, callback) => {
            debug('Deleting %s', sid);
            this.sessionModel.find({ where: { sid: sid } })
                .then((session) => {
                if (!session) {
                    debug('Could not find session %s', sid);
                    return null;
                }
                return session.destroy();
            }).asCallback(callback);
        };
        this.get = (sid, callback) => {
            debug('GET "%s"', sid);
            this.sessionModel.find({ where: { sid: sid } })
                .then((session) => {
                if (!session) {
                    debug('No session with id %s', sid);
                    return undefined;
                }
                debug('FOUND %s', session.sid);
                return {
                    user: session.user,
                    cookie: this.formatCookie(session.expires)
                };
            }).asCallback(callback);
        };
        this.length = (callback) => {
            this.sessionModel.count().asCallback(callback);
        };
        this.set = (sid, data, callback) => {
            debug('INSERT "%s"', sid);
            const expires = this.determineExpiration(data.cookie);
            const defaults = {
                user: undefined,
                expires: expires
            };
            const values = Object.assign({}, defaults, data);
            this.sessionModel.findCreateFind({
                where: { 'sid': sid },
                defaults: values
            }).spread((existingRecord) => {
                const existingSession = existingRecord.dataValues;
                if (existingSession.user != values.user) {
                    existingSession.user = values.user;
                    existingSession.expires = expires;
                    existingSession.cookie = this.formatCookie(existingSession.expires);
                    const sql = `
        UPDATE sessions
        SET "user" = :user
        WHERE sid = :sid`;
                    return this.sessionModel.sequelize.query(sql, {
                        replacements: {
                            sid: sid,
                            user: values.user
                        }
                    });
                }
                existingSession.cookie = this.formatCookie(existingSession.expires);
                return existingSession;
            }).asCallback(callback);
        };
        this.sessionModel = sessionModel;
        if (typeof config.expiration != 'number')
            throw new Error("Cookie expiration must be set to a number of milliseconds.");
        this.config = config;
        this.startSessionCron();
    }
    deleteExpiredSessions(callback) {
        debug('CLEARING EXPIRED SESSIONS');
        return this.sessionModel.destroy({ where: { expires: { lt: new Date() } } }).asCallback(callback);
    }
    startSessionCron() {
        this.stopSessionCron();
        if (this.config.updateFrequency > 0) {
            this.expirationCron = setInterval((callback) => this.deleteExpiredSessions(callback), this.config.updateFrequency);
        }
    }
    stopSessionCron() {
        if (this.expirationCron) {
            clearInterval(this.expirationCron);
            this.expirationCron = undefined;
        }
    }
    determineExpiration(cookie) {
        return cookie && cookie.expires
            ? cookie.expires
            : new Date(Date.now() + this.config.expiration);
    }
    formatCookie(expires) {
        return {
            maxAge: this.config.expiration,
            secure: this.config.secure || false,
            expires: expires
        };
    }
    touchSession(sid, data, callback) {
        debug('TOUCH "%s"', sid);
        const expires = this.determineExpiration(data.cookie);
        this.sessionModel.update({ expires: expires }, { where: { sid: sid } })
            .then((rows) => rows).asCallback(callback);
    }
}
exports.SequelizeStore = SequelizeStore;
//# sourceMappingURL=session-store.js.map