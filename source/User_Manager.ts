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

export interface User_Info {
  username: string
}

export interface User_Info_With_Password extends User_Info {
  password: string
}
export class User_Manager {
  db: mongoose.Connection
  User: mongoose.Model<any>
  authenticate_middleware

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
    this.User = mongoose.model('User', user_schema)
    app.use(passport.initialize())
    passport.use(new LocalStrategy(
      (username, password, done) => {
        this.User.findOne({username: username})
          .then(user => {
            if (!user || user.password != password)
              throw new Bad_Request('Incorrect username or password.')

            delete user.password
            done(null, user)
          })
          .catch(error => done(error))
      }
    ))

    this.authenticate_middleware = function(req, res, next) {
      passport.authenticate('local', function(error, user, info) {
        if (error)
          return next(error)

        if (!user)
          return next(new HTTP_Error("Failed to login."))

        req.logIn(user, error => {
          if (error)
            return next(new HTTP_Error("Failed to login."))

          return next()
        })
      })(req, res, next)
    }

    this.initialize_endpoints(app)
  }

  get_user(username): Promise<User_Info> {
    return new Promise((resolve, reject) => this.User.findOne({username: username}))
      .then((user: User_Info_With_Password) => {
        if (user) {
          delete user.password
        }
        return user
      })
  }

  initialize_endpoints(app) {

    lawn.initialize_endpoints(app, [

      {
        method: Method.get,
        path: "user",
        middleware: [this.authenticate_middleware],
        action: function(request) {
          return Promise.resolve()
        }
      },

      {
        method: Method.post,
        path: "user/login",
        middleware: [this.authenticate_middleware],
        action: function(request) {
          return Promise.resolve()
        }
      }

    ])
  }

  get_authenticate_middleware() {
    return this.authenticate_middleware
  }

  create_user(fields): Promise<any> {
    const user = new this.User(fields)
    return user.save()
  }
}