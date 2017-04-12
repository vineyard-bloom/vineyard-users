const session = require('express-session');
import {Method, HTTP_Error, Bad_Request} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as Sequelize from 'sequelize'

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

export class User_Manager {
  db: Sequelize.Sequelize
  User_Model: any
  Session_Model
  table_keys: Table_Keys

  constructor(app: express.Application, db: Sequelize.Sequelize, settings: Settings) {
    this.db = db
    if (!settings)
      throw new Error("Missing User_Manager settings argument.")

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
        user: Sequelize.INTEGER,
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

  create_user(fields): Promise<any> {
    return this.User_Model.create(fields)
  }

  create_user_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.get,
      path: "user",
      action: request => {
        return this.User_Model.findOne({
          where: {
            id: request.session.user
          }
        })
          .then(response => {
            if (!response)
              throw new Bad_Request('Invalid user id.')

            const user = response.dataValues
            delete user.password
            return user
          })
      }
    }, overrides)
  }

  create_login_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/login",
      action: request => {
        return this.User_Model.findOne({
          where: {
            username: request.data.username,
            password: request.data.password
          }
        })
          .then(response => {
            if (!response)
              throw new Bad_Request('Incorrect username or password.')

            const user = response.dataValues
            request.session.user = user.id

            delete user.password
            return user
          })
      }
    }, overrides)
  }

  create_logout_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
    lawn.create_endpoint_with_defaults(app, {
      method: Method.post,
      path: "user/logout",
      action: request => {
        if (!request.session.user)
          throw new Bad_Request('Already logged out.')

        request.session.user = null
        return Promise.resolve({})
      }
    }, overrides)
  }

  create_all_endpoints(app) {
    this.create_user_endpoint(app)
    this.create_login_endpoint(app)
    this.create_logout_endpoint(app)
  }
}

