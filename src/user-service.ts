import {Onetimecode, UserManager} from "./user-manager";

const session = require('express-session');
import {Bad_Request, Request, BadRequest} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as two_factor from './two-factor'
import {User, UserWithPassword} from "./User";
import {SequelizeStore} from "./session-store";

const bcrypt = require('bcrypt')

export interface ServiceSettings {
  secret: string
  cookie: any
  rolling?: true
}

export type Service_Settings = ServiceSettings

function sanitize(user: UserWithPassword): User {
  const result = Object.assign({}, user)
  delete result.password
  delete result.two_factor_secret
  return result
}

export function createDefaultSessionStore(userManager: UserManager, expiration: number, secure: boolean) {
  return new SequelizeStore(userManager.getSessionCollection().getTableClient().getSequelizeModel(), {
    expiration: expiration,
    updateFrequency: 5 * 60 * 1000,
    secure: secure,
  })
}

export class UserService {
  private userManager: UserManager
  private user_manager: UserManager

  constructor(app: express.Application, userManager: UserManager, settings: ServiceSettings,
              sessionStore: any = createDefaultSessionStore(userManager, settings.cookie.maxAge, settings.cookie.secure)) {

    this.userManager = this.user_manager = userManager

    if (!settings.secret)
      throw new Error("UserService settings.secret cannot be empty.")

    app.use(session({
      secret: settings.secret,
      store: sessionStore,
      cookie: settings.cookie,
      resave: false,
      saveUninitialized: true
    }))

    // Backwards compatibility
    const self: any = this
    self.login = () => {
      return (request: Request) => this.loginWithUsername(request)
    }

    self.create_login_handler = () => {
      return (request: Request) => this.loginWithUsername(request)
    }

    self.create_login_2fa_handler = () => {
      return (request: Request) => this.checkUsernameOrEmailLogin(request)
        .then(user => {
          this.checkTwoFactor(user, request)
          return this.finishLogin(request, user)
        })
    }

    self.createLogin2faHandlerWithBackup = () => {
      return (request: Request) => this.login2faWithBackup(request)
    }

    self.createLogoutHandler = () => {
      return (request: Request) => this.logout(request)
    }

    self.create_logout_handler = () => {
      return self.createLogoutHandler()
    }
  }

  private _checkLogin(filter: any, password: string) {
    return this.userManager.getUserModel().first(filter)
      .then(user => {
        if (!user)
          throw new Bad_Request('Incorrect username or password.', {key: 'invalid-credentials'})

        return bcrypt.compare(password, user.password)
          .then((success: boolean) => success
            ? user
            : this.checkTempPassword(user, password)
          )
      })
  }

  checkTempPassword(user: User, password: string) {
    return this.userManager.matchTempPassword(user, password)
      .then(success => {
        if (!success)
          throw new Bad_Request('Incorrect username or password.', {key: 'invalid-credentials'})

        return user
      })
  }

  checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  checkUsernameOrEmailLogin(request: Request): Promise<UserWithPassword> {
    const data = request.data

    const filter = data.username
      ? {username: data.username}
      : {email: data.email}

    return this._checkLogin(filter, data.password)
  }

  checkEmailLogin(request: Request): Promise<UserWithPassword> {
    const data = request.data
    return this._checkLogin({email: data.email}, data.password)
  }

  finishLogin(request: Request, user: UserWithPassword) {
    request.session.user = user.id
    return sanitize(user)
  }

  loginWithUsername(request: Request) {
    return this.checkUsernameOrEmailLogin(request)
      .then(user => this.finishLogin(request, user))
  }

  checkTwoFactor(user: User, request: Request) {
    if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
      throw new Bad_Request('Invalid Two Factor Authentication code.', {key: "invalid-2fa"})
  }

  login2faWithBackup(request: Request) {
    return this.checkUsernameOrEmailLogin(request)
      .then(user => {
        const currentUser = user
        if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
          return this.verify2faOneTimeCode(request, currentUser).then(backupCodeCheck => {
            if (!backupCodeCheck)
              throw new Bad_Request('Invalid Two Factor Authentication code.', {key: "invalid-2fa"})
            return this.finishLogin(request, currentUser)
          })
        return this.finishLogin(request, currentUser)
      })
  }

  verify2faOneTimeCode(request: Request, user: User): Promise<boolean> {
    return this.userManager.getUserOneTimeCode(user).then((code: Onetimecode | undefined) => {
      if (!code) {
        return false
      }
      return this.userManager.compareOneTimeCode(request.data.twoFactor, code).then(pass => {
        if (!pass) {
          return false
        }
        return this.userManager.setOneTimeCodeToUnavailable(<Onetimecode> code)
          .then(() => {
            request.session.oneTimeCodeUsed = true
            return true
          })
      })
    })
  }

  logout(request: Request) {
    if (!request.session.user)
      throw new BadRequest('Already logged out.', {key: 'already-logged-out'})

    request.session.user = null
    return Promise.resolve({})
  }

  createTempPassword(username: string): Promise<any> {
    return this.userManager.getUserModel().first({username: username})
      .then(user => {
        if (!user)
          throw new BadRequest(
            "Invalid username",
            {
              key: "invalid-username",
              data: {username: username}
            }
          )

        return this.userManager.getTempPassword(user)
          .then(tempPassword => {
            if (!tempPassword) {
              const passwordString = Math.random().toString(36).slice(2)
              return this.userManager.hashPassword(passwordString)
                .then(hashedPassword => this.userManager.getTempPasswordCollection().create({
                    user: user,
                    password: hashedPassword
                  })
                )
                .then(() => {
                  return {
                    tempPassword: passwordString,
                    user: user
                  }
                })
            } else {
              throw new BadRequest(
                "A temporary password has already been created. Please try again at a later time.",
                {
                  key: 'existing-temp-pass'
                }
              )
            }
          })
      })
  }

  require_logged_in(request: lawn.Request) {
    if (!request.session.user)
      throw new lawn.Needs_Login()
  }

  getSanitizedUser(id: string): Promise<User> {
    return this.getModel()
      .getUser(id)
      .then(sanitize)
  }

  addUserToRequest(request: Request): Promise<User | undefined> {
    if (request.user)
      return Promise.resolve(request.user)

    return this.userManager.getUser(request.session.user)
      .then(user => {
        if (user)
          return request.user = sanitize(user)
        else
          return undefined
      })
  }

  loadValidationHelpers(ajv: any) {
    ajv.addSchema(require('./validation/helpers.json'))
  }

  fieldExists(request: Request, fieldOptions: string[]) {
    const keyName = request.data.key
    const value = request.data.value
    if (fieldOptions.indexOf(keyName) == -1)
      throw new Bad_Request(
        'Invalid user field',
        {
          key: 'invalid-user-field',
          data: {field: keyName}
        }
      )

    return this.userManager.fieldExists(keyName, value)
      .then(result => ({
        exists: result
      }))
  }

  getModel(): UserManager {
    return this.userManager
  }
}

export class User_Service extends UserService {
  constructor(app: express.Application, UserManager: UserManager, settings: ServiceSettings) {
    super(app, UserManager, settings)
  }
}
