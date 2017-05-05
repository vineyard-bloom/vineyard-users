import {User_Manager} from "./User_Manager";
const session = require('express-session');
import {Method, HTTP_Error, Bad_Request} from 'vineyard-lawn'
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

  prepare_new_user(fields): Promise<User> {
    if (!fields.username)
      throw new Bad_Request("Missing username field")

    if (!fields.password)
      throw new Bad_Request("Missing password field")

    return this.user_manager.User_Model.first_or_null({username: fields.username}).select(['id'])
      .then(user => {
        if (user)
          throw new Bad_Request("That username is already taken.")

        return this.user_manager.prepare_new_user(fields)
      })
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
        if (!two_factor.verify_2fa_token(user.two_factor_secret, request.data.token))
          throw new Bad_Request("Invalid 2FA token.")

        return sanitize(user)
      })
  }

  create_logout_handler(): lawn.Response_Generator {
    return request => {
      if (!request.session.user)
        throw new Bad_Request('Already logged out.')

      request.session.user = null
      return Promise.resolve({})
    }
  }

  create_get_user_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.get,
      path: "user",
      action: request => {
        return this.user_manager.User_Model.get(request.session.user)
          .then(response => {
            if (!response)
              throw new Bad_Request('Invalid user id.')

            const user = response.dataValues
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
}

export class User_Service extends UserService {
  constructor(app: express.Application, user_manager: User_Manager, settings: Service_Settings) {
    super(app, user_manager, settings)
  }
}