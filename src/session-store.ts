import * as path from 'path'

var debug = require('debug')('vineyard-session-store')

export interface SequelizeStoreOptions {
  expiration: number
  updateFrequency: number
}

export interface NewSessionRecord {
  user: string | undefined
  expires: Date
}

export interface SessionRecord extends NewSessionRecord {
  sid: string
}

export interface SequelizeSessionRecord extends SessionRecord {
  destroy: any
  save: any
}

export interface ExpressCookie {
  expires: Date
}

export interface ExpressSession {
  cookie: ExpressCookie
}

export type SimpleCallback = (error: Error) => void

export class SequelizeStore {
  options: SequelizeStoreOptions
  sessionModel: any
  expirationCron: any

  constructor(sessionModel: any, options: SequelizeStoreOptions) {
    this.options = options

    this.startSessionCron()
  }

  private deleteExpiredSessions(callback: SimpleCallback) {
    debug('CLEARING EXPIRED SESSIONS')
    return this.sessionModel.destroy({where: {expires: {lt: new Date()}}}).asCallback(callback)
  }

  public startSessionCron() {
    this.stopSessionCron()
    if (this.options.updateFrequency > 0) {
      this.expirationCron = setInterval((callback: SimpleCallback) => this.deleteExpiredSessions(callback),
        this.options.updateFrequency
      )
    }
  }

  public stopSessionCron() {
    if (this.expirationCron) {
      clearInterval(this.expirationCron)
      this.expirationCron = undefined
    }
  }

  private determineExpiration(cookie: ExpressCookie | undefined): Date {
    return cookie && cookie.expires
      ? cookie.expires
      : new Date(Date.now() + this.options.expiration)
  }

  // Session Interface Implementation

  clear(callback: SimpleCallback) {
    return this.sessionModel.destroy({
      where: {},
      truncate: true
    }).asCallback(callback)
  }

  destroySession(sid: string, callback: SimpleCallback) {
    debug('Deleting %s', sid)
    return this.sessionModel.find({where: {sid: sid}})
      .then((session: SequelizeSessionRecord) => {
        if (!session) {
          debug('Could not find session %s', sid)
          return null
        }
        return session.destroy()
      }).asCallback(callback)
  }

  get(sid: string, callback: (error: Error, session: any) => void): Promise<SessionRecord | undefined> {
    debug('Get "%s"', sid)
    return this.sessionModel.find({where: {sid: sid}})
      .then((session: SessionRecord) => {
        if (!session) {
          debug('No session with id %s', sid)
          return undefined
        }
        debug('Found %s', session.sid)

        return {
          user: session.user
        }
      }).asCallback(callback)
  }

  length(callback: SimpleCallback) {
    return this.sessionModel.count().asCallback(callback)
  }

  set(sid: string, data: ExpressSession, callback: SimpleCallback): Promise<any> {
    debug('INSERT "%s"', sid)
    const expires = this.determineExpiration(data.cookie)

    const defaults: NewSessionRecord = {
      user: undefined,
      expires: expires
    }

    const values: NewSessionRecord = Object.assign({}, defaults, data)

    return this.sessionModel.findCreateFind({
      where: {'sid': sid},
      defaults: values
    }).spread(function sessionCreated(existingSession: SequelizeSessionRecord) {
      let changed = false
      if (existingSession.user != values.user) {
        existingSession.user = values.user
        changed = true
      }
      if (changed) {
        existingSession.expires = expires
        return existingSession.save().return(existingSession)
      }
      return existingSession
    }).asCallback(callback)
  }

  touchSession(sid: string, data: ExpressSession, callback: SimpleCallback) {
    debug('TOUCH "%s"', sid)
    const expires = this.determineExpiration(data.cookie)

    return this.sessionModel.update({expires: expires}, {where: {sid: sid}})
      .then((rows: any) => rows).asCallback(callback)
  }
}