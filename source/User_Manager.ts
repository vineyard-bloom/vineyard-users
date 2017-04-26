const session = require('express-session');
import {Method, HTTP_Error, Bad_Request} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as Sequelize from 'sequelize'
import * as two_factor from './two-factor'

const bcrypt = require('bcrypt')

export interface Table_Keys {
  id: string
  username: string
  password: string
}

export interface Settings {
  secret: string
  user_model
  cookie?
  table_keys?
}

function sanitize(user: User_With_Password): User {
  const result = Object.assign({}, user)
  delete result.password
  delete result.salt
  return result
}

export class User_Manager {
  db: Sequelize.Sequelize
  User_Model: any
  Session_Model
  table_keys: Table_Keys

  constructor(app: express.Application, db: Sequelize.Sequelize, settings: Settings) {
    this.db = db
    if (!settings)
      throw new Error("Missing settings argument.")

    if (!settings.user_model)
      throw new Error("Missing user_model settings argument.")

    this.table_keys = settings.table_keys || {
        id: "id",
        username: "username,",
        password: "password"
      }

    const SequelizeStore = require('connect-session-sequelize')(session.Store)

    this.User_Model = settings.user_model

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
      }
    )

    app.use(session({
      secret: settings.secret,
      store: new SequelizeStore({
        db: db,
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

  // get_user(username): Promise<User> {
  //   return this.User_Model.findOne({username: username})
  //     .then((user: User_With_Password) => {
  //       if (!)
  //       if (user) {
  //         delete user.password
  //       }
  //       return user
  //     })
  // }

  prepare_new_user(fields): Promise<User> {
    if (!fields.username)
      throw new Bad_Request("Missing username field")

    if (!fields.password)
      throw new Bad_Request("Missing password field")

    return this.User_Model.first_or_null({username: fields.username}).select(['id'])
      .then(user => {
        if (user)
          throw new Bad_Request("That username is already taken.")

        return bcrypt.hash(fields.password, 10)
          .then(salt_and_hash => {
            fields.password = salt_and_hash
            return fields
          })
      })
  }

  create_user(fields): Promise<any> {
    return this.prepare_new_user(fields)
      .then(user => this.User_Model.create(fields))
  }

  create_user_with_2fa(request:lawn.Request): Promise<User> {
    const fields = request.data
    return this.prepare_new_user(fields)
      .then(user => {
        fields.two_factor_secret = two_factor.verify_2fa_request(request)
        fields.two_factor_enabled = true
        delete fields.token
        return this.User_Model.create(fields)
      })
  }

  private check_login(request) {
    return this.User_Model.first({username: request.data.username})
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
        return this.User_Model.get(request.session.user)
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

