const debug = require('debug')('vineyard-session-store')
import {Store} from 'express-session'

export interface SequelizeStoreConfig {
  expiration: number
  updateFrequency: number
  secure: boolean
}

export interface NewSessionRecord {
  user: string | undefined
  expires: Date
}

export interface SessionRecord extends NewSessionRecord {
  sid: string
}

export interface SequelizeSessionRecord extends SessionRecord {
  dataValues: any
  destroy: any
  save: any
  update: any
}

export type SimpleCallback = (error: Error) => void

export class SequelizeStore extends Store {
  config: SequelizeStoreConfig
  sessionModel: any
  expirationCron: any

  constructor(sessionModel: any, config: SequelizeStoreConfig) {
    super()
    this.sessionModel = sessionModel
    if (typeof config.expiration != 'number')
      throw new Error("Cookie expiration must be set to a number of milliseconds.")

    this.config = config
    this.startSessionCron()
  }

  private deleteExpiredSessions(callback: SimpleCallback) {
    debug('CLEARING EXPIRED SESSIONS')
    return this.sessionModel.destroy({where: {expires: {lt: new Date()}}}).asCallback(callback)
  }

  public startSessionCron() {
    this.stopSessionCron()
    if (this.config.updateFrequency > 0) {
      this.expirationCron = setInterval((callback: SimpleCallback) => this.deleteExpiredSessions(callback),
        this.config.updateFrequency
      )
    }
  }

  public stopSessionCron() {
    if (this.expirationCron) {
      clearInterval(this.expirationCron)
      this.expirationCron = undefined
    }
  }

  private determineExpiration(cookie: any | undefined): Date {
    return cookie && cookie.expires
      ? cookie.expires
      : new Date(Date.now() + this.config.expiration)
  }

  // Session Interface Implementation

  clear = (callback: (err: any) => void) => {
    this.sessionModel.destroy({
      where: {},
      truncate: true
    }).asCallback(callback)
  }

  destroySession(sid: string, callback: SimpleCallback) {
    debug('Deleting %s', sid)
    this.sessionModel.find({where: {sid: sid}})
      .then((session: SequelizeSessionRecord) => {
        if (!session) {
          debug('Could not find session %s', sid)
          return null
        }
        return session.destroy()
      }).asCallback(callback)
  }

  formatCookie(expires: Date) {
    return {
      maxAge: this.config.expiration,
      secure: this.config.secure || false,
      expires: expires
    }
  }

  get = (sid: string, callback: (err: any, session: Express.Session) => void) => {
    debug('GET "%s"', sid)
    this.sessionModel.find({where: {sid: sid}})
      .then((session: SessionRecord) => {
        if (!session) {
          debug('No session with id %s', sid)
          return undefined
        }
        debug('FOUND %s', session.sid)

        return {
          user: session.user,
          cookie: this.formatCookie(session.expires)
        }
      }).asCallback(callback)
  }

  length = (callback: (err: any, length: number) => void) => {
    this.sessionModel.count().asCallback(callback)
  }

  set = (sid: string, data: Express.Session, callback: (err: any, session: Express.Session) => void) => {
    debug('INSERT "%s"', sid)
    const expires = this.determineExpiration(data.cookie)

    const defaults: NewSessionRecord = {
      user: undefined,
      expires: expires
    }

    const values: NewSessionRecord = Object.assign({}, defaults, data)

    this.sessionModel.findCreateFind({
      where: {'sid': sid},
      defaults: values
    }).spread((existingRecord: SequelizeSessionRecord) => {
      const existingSession = existingRecord.dataValues
      if (existingSession.user != values.user) {
        existingSession.user = values.user
        existingSession.expires = expires
        existingSession.cookie = this.formatCookie(existingSession.expires)
        const sql = `
        UPDATE sessions
        SET "user" = :user
        WHERE sid = :sid`
        return this.sessionModel.sequelize.query(sql, {
          replacements: {
            sid: sid,
            user: values.user
          }
        })
      }
      existingSession.cookie = this.formatCookie(existingSession.expires)
      return existingSession
    }).asCallback(callback)
  }

  touchSession(sid: string, data: any, callback: SimpleCallback) {
    debug('TOUCH "%s"', sid)
    const expires = this.determineExpiration(data.cookie)

    this.sessionModel.update({expires: expires}, {where: {sid: sid}})
      .then((rows: any) => rows).asCallback(callback)
  }
}