import {User_Manager} from "./User_Manager";
const session = require('express-session');
import {Method, HTTP_Error, Bad_Request, Request} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as two_factor from './two-factor'

const bcrypt = require('bcrypt')

export interface Service_Settings {
  secret: string
  cookie?
}

function sanitize(user: User_With_Password): User {
  const result = Object.assign({}, user)
  delete result.password
  delete result.salt
  return result
}

export class UserService {
  user_manager: User_Manager

  constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings) {
    this.user_manager = user_manager
    const SequelizeStore = require('connect-session-sequelize')(session.Store)

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
    }))
  }

  private check_login(request) {
    return this.user_manager.User_Model.first({username: request.data.username})
      .then(response => {
        if (!response)
          throw new Bad_Request('Incorrect username or password.')

        return bcrypt.compare(request.data.password, response.password)
          .then(success => {
            if (!success)
              throw new Bad_Request('Incorrect username or password.')

            const user = response
            request.session.user = user.id
            return user
          })
      })
  }

  create_login_handler(): lawn.Response_Generator {
    return request => this.check_login(request)
      .then(user => sanitize(user))
  }

  create_login_2fa_handler(): lawn.Response_Generator {
    return request => this.check_login(request)
      .then(user => {
        if (!two_factor.verify_2fa_token(user.two_factor_secret, request.data.twoFactor))
          throw new Bad_Request("Invalid 2FA token.")

        return sanitize(user)
      })
  }

  createLogoutHandler(): lawn.Response_Generator {
    return request => {
      if (!request.session.user)
        throw new Bad_Request('Already logged out.')

      request.session.user = null
      return Promise.resolve({})
    }
  }

  create_logout_handler(): lawn.Response_Generator {
    return this.createLogoutHandler()
  }

  create_get_user_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.get,
      path: "user",
      action: request => {
        return this.user_manager.getUser(request.session.user)
          .then(user => {
            if (!user)
              throw new Bad_Request('Invalid user id.')

            return sanitize(user)
          })
      }
    }, overrides)
  }

  create_login_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/login",
      action: this.create_login_handler()
    }, overrides)
  }

  create_logout_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/logout",
      action: this.create_logout_handler()
    }, overrides)
  }

  create_all_endpoints(app) {
    this.create_get_user_endpoint(app)
    this.create_login_endpoint(app)
    this.create_logout_endpoint(app)
  }

  require_logged_in(request: lawn.Request) {
    if (!request.session.user)
      throw new lawn.Needs_Login()
  }

  addUserToRequest(request: Request): Promise<User> {
    if (request.user)
      return Promise.resolve(request.user)

    return this.user_manager.getUser(request.session.user)
      .then(user => request.user = sanitize(user))
  }

  loadValidationHelpers(ajv) {
    ajv.addSchema(require('./validation/helpers.json'))
  }

  fieldExists(request: Request, fieldOptions: string[]) {
    const key = request.data.key
    const value = request.data.value
    if (fieldOptions.indexOf(key) == -1)
      throw new Bad_Request('Invalid user field: "' + key + '"')

    return this.user_manager.fieldExists(key, value)
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