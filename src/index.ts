const session = require('express-session');
const mongo_store = require('connect-mongo')(session);
import {Method, HTTP_Error, Bad_Request} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
const mongoose = require('mongoose')
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

export function initialize(app: express.Application, mongoose_connection, settings: Settings) {

  app.use(session({
    secret: settings.secret,
    store: new mongo_store({mongooseConnection: mongoose_connection}),
    cookie: {secure: true}
  }))

  const user_fields = settings.user || {}
  user_fields.username = String
  user_fields.password = String

  const User = new mongoose.Schema()
  module.exports = mongoose.model('User', User)

  function get_user(username): Promise<User_Info> {
    return new Promise((resolve, reject) => User.findOne({username: username}))
      .then((user: User_Info_With_Password) => {
        if (user) {
          delete user.password
        }
        return user
      })
  }

  passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findOne({username: username})
        .then(user => {
          if (!user || user.password != password)
            throw new Bad_Request('Incorrect username or password.')

          delete user.password
          done(null, user)
        })
    }
  ))

  lawn.initialize_endpoints(app, [

    {
      method: Method.get,
      path: "user",
      action: function(request) {
        return Promise.resolve()
      }
    },

    {
      method: Method.post,
      path: "user/login",
      action: function(request) {
        passport.authenticate('local', function(error, user, info) {
          if (error)
            throw error

          if (!user)
            throw new HTTP_Error("Failed to login.")

          request.logIn(user, error => {
            if (error)
              throw new HTTP_Error("Failed to login.")

            return {
              message: "Login succeeeded."
            }
          })
        })
      }
    }

  ])
}