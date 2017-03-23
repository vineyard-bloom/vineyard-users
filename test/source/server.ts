import * as express from 'express'
import * as mongoose from 'mongoose'
import * as lawn from 'vineyard-lawn'
import {User_Manager} from '../../source/index'
import * as vineyard_users from '../../source/index'

const config = require('../config/config.json')

export class Server {
  private server: lawn.Server
  private db
  private user_manager: User_Manager

  constructor() {
    this.server = new lawn.Server()
  }

  private start_mongoose(): Promise<void> {
    require('mongoose').Promise = global.Promise
    return mongoose.connect('mongodb://' + config.database.url)
      .then(() => {
        this.db = mongoose.connection
        console.log('Connected to Mongo.')
      })
  }

  private start_api(): Promise<void> {
    return this.server.start(config.api)
  }

  create_endpoints() {
    vineyard_users.create_user_endpoint(this.server.get_app())
    vineyard_users.create_login_endpoint(this.server.get_app())
  }

  start() {
    return this.start_mongoose()
      .then(() => this.user_manager = new User_Manager(this.server.get_app(), this.db, {secret: 'test'}))
      .then(() => this.create_endpoints())
      .then(() => this.start_api())
  }

  get_url() {
    return "localhost:" + this.server.get_port()
  }

  get_db() {
    return this.db
  }

  get_user_manager() {
    return this.user_manager
  }

  stop() {
    return this.server.stop()
  }
}
