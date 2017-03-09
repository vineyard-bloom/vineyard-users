const session = require('express-session');
const mongo_store = require('connect-mongo')(session);
import {Method} from 'vineyard-lawn'
import * as lawn from 'vineyard-lawn'
import * as express from 'express'
const mongoose = require('mongoose')
const passport_local_mongoose = require('passport-local-mongoose')

export interface Settings {
  secret: string
  user?
}

export function initialize(app: express.Application, mongoose_connection, settings: Settings) {

  app.use(session({
    secret: settings.secret,
    store: new mongo_store({mongooseConnection: mongoose_connection}),
    cookie: {secure: true}
  }))

  const User = new mongoose.Schema(settings.user || {});
  User.plugin(passport_local_mongoose);
  module.exports = mongoose.model('User', User);

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
        return Promise.resolve()
      }
    }

  ])
}