import {User_Manager} from "./user-manager";

const session = require('express-session');
import {Method, HTTP_Error, Bad_Request, Request, BadRequest} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as two_factor from './two-factor'
import {User, User_With_Password} from "./User";

const bcrypt = require('bcrypt')

export interface Service_Settings {
  secret: string
  cookie?: any
}

function sanitize(user: User_With_Password): User {
  const result = Object.assign({}, user)
  delete result.password
  return result
}

export class UserService {
  user_manager: User_Manager

  constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings) {
    this.user_manager = user_manager
    const SequelizeStore = require('connect-session-sequelize')(session.Store)

    if (!settings.secret)
      throw new Error("UserService settings.secret cannot be empty.")

    app.use(session({
      secret: settings.secret,
      store: new SequelizeStore({
        db: user_manager.db,
        table: 'session',
        extendDefaultFields: function (defaults: any, session: any) {
          return {
            expires: defaults.expires,
            user: session.user
          };
        },
        checkExpirationInterval: 5 * 60 * 1000
      }),
      cookie: settings.cookie || {},
      resave: false,
      saveUninitialized: true
    }))
  }

  private checkTempPassword(user: User, password: string) {
    return this.user_manager.matchTempPassword(user, password)
      .then(success => {
        if (!success)
          throw new Bad_Request('Incorrect username or password.', {key: 'invalid-credentials'})

        return user
      })
  }

  checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  private checkLogin(request: Request): Promise<User_With_Password> {
    const {
      username: reqUsername,
      password: reqPass,
      email: reqEmail
    } = request.data

    const queryObj = reqUsername
      ? {username: reqUsername}
      : {email: reqEmail}
    return this.user_manager.User_Model.first(queryObj)
      .then(user => {
        if (!user)
          throw new Bad_Request('Incorrect username or password.', {key: 'invalid-credentials'})

        return bcrypt.compare(reqPass, user.password)
          .then((success: boolean) => success
            ? user
            : this.checkTempPassword(user, reqPass)
          )
      })
  }

  private finishLogin(request: Request, user: User_With_Password) {
    request.session.user = user.id
    return sanitize(user)
  }

  login(request: Request) {
    return this.checkLogin(request)
      .then(user => this.finishLogin(request, user))
  }

  create_login_handler(): lawn.Response_Generator {
    return request => this.login(request)
  }

  create_login_2fa_handler(): lawn.Response_Generator {
    return request => this.checkLogin(request)
      .then(user => {
        if (user.two_factor_enabled && !two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
          throw new Bad_Request('Invalid Two Factor Authentication code.', {key: "invalid-2fa"})

        return this.finishLogin(request, user)
      })
  }

  logout(request: Request) {
    if (!request.session.user)
      throw new Bad_Request('Already logged out.', {key: 'already-logged-out'})

    request.session.user = null
    return Promise.resolve({})
  }

  createLogoutHandler(): lawn.Response_Generator {
    return request => this.logout(request)
  }

  create_logout_handler(): lawn.Response_Generator {
    return this.createLogoutHandler()
  }

  create_get_user_endpoint(app: any, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.get,
      path: "user",
      action: request => {
        return this.user_manager.getUser(request.session.user)
          .then(user => {
            if (!user)
              throw new Bad_Request("Invalid user ID", {key: 'invalid-user-id'})

            return sanitize(user)
          })
      }
    }, overrides)
  }

  createTempPassword(username: string): Promise<any> {
    return this.user_manager.user_model.first({username: username})
      .then(user => {
        if (!user)
          throw new BadRequest(
            "Invalid username",
            {
              key: "invalid-username",
              data: {username: username}
            }
          )

        return this.user_manager.getTempPassword(user)
          .then(tempPassword => {
            if (!tempPassword) {
              const passwordString = Math.random().toString(36).slice(2)
              return this.user_manager.hashPassword(passwordString)
                .then(hashedPassword => this.user_manager.tempPasswordCollection.create({
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

  create_login_endpoint(app: any, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/login",
      action: this.create_login_handler()
    }, overrides)
  }

  create_logout_endpoint(app: any, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/logout",
      action: this.create_logout_handler()
    }, overrides)
  }

  create_all_endpoints(app: any) {
    this.create_get_user_endpoint(app)
    this.create_login_endpoint(app)
    this.create_logout_endpoint(app)
  }

  require_logged_in(request: lawn.Request) {
    if (!request.session.user)
      throw new lawn.Needs_Login()
  }

  addUserToRequest(request: Request): Promise<User | undefined> {
    if (request.user)
      return Promise.resolve(request.user)

    return this.user_manager.getUser(request.session.user)
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

    return this.user_manager.fieldExists(keyName, value)
      .then(result => ({
        exists: result
      }))
  }
}

export class User_Service extends UserService {
  constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings) {
    super(app, user_manager, settings)
  }
}
