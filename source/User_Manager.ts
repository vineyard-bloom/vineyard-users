const session = require('express-session');
const mongo_store = require('connect-mongo')(session);
import {Method, HTTP_Error, Bad_Request} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
import * as mongoose from 'mongoose'
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

export interface Settings {
  secret: string
  user?
}

export interface Endpoint_Info {

}

export class User_Manager {
  db: mongoose.Connection
  User_Model: mongoose.Model<any>

  constructor(app: express.Application, mongoose_connection: mongoose.Connection, settings: Settings) {
    this.db = mongoose_connection

    app.use(session({
      secret: settings.secret,
      store: new mongo_store({mongooseConnection: this.db}),
      cookie: {secure: true},
      resave: false,
      saveUninitialized: false
    }))

    const user_fields = settings.user || {}
    user_fields.username = String
    user_fields.password = String

    const user_schema = new mongoose.Schema(user_fields)
    this.User_Model = mongoose.model('User', user_schema)
    passport.use(new LocalStrategy(
      (username, password, done) => {
        this.User_Model.findOne({username: username})
          .then(user => {
            if (!user || user.password != password)
              throw new Bad_Request('Incorrect username or password.')

            delete user.password
            done(null, user)
          })
          .catch(error => done(error))
      }
    ))

  //   this.authenticate_middleware = function(req, res, next) {
  //     passport.authenticate('local', function(error, user, info) {
  //       if (error)
  //         return next(error)
  //
  //       if (!user)
  //         return next(new HTTP_Error("Failed to login."))
  //
  //       req.logIn(user, error => {
  //         if (error)
  //           return next(new HTTP_Error("Failed to login."))
  //
  //         return next()
  //       })
  //     })(req, res, next)
  //   }
  //
  }

  get_user(username): Promise<User> {
    return new Promise((resolve, reject) => this.User_Model.findOne({username: username}))
      .then((user: User_With_Password) => {
        if (user) {
          delete user.password
        }
        return user
      })
  }

  create_user(fields): Promise<any> {
    const user = new this.User_Model(fields)
    return user.save()
  }
}

export function create_user_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
  lawn.create_endpoint_with_defaults(app, {
    method: Method.get,
    path: "user",
    action: function(request) {
      return Promise.resolve()
    }
  }, overrides)
}

export function create_login_endpoint(app, overrides: lawn.Optional_Endpoint_Info = {}) {
  lawn.create_endpoint_with_defaults(app, {
    method: Method.post,
    path: "user/login",
    action: function(request) {
      return Promise.resolve()
    }
  }, overrides)
}
