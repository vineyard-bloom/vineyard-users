import * as lawn from 'vineyard-lawn'
import {User_Manager} from '../../source/index'
import * as vineyard_users from '../../source/index'
import * as Sequelize from 'sequelize'
import {Schema} from "../../../vineyard-schema/source/scheming";
import {Modeler} from "../../../vineyard-ground/source/modeler";

const config = require('../config/config.json')

export class Server {
  private server: lawn.Server
  private db
  private user_manager: User_Manager

  constructor() {
    this.server = new lawn.Server()
  }

  private start_database() {
    this.db = new Sequelize(config.database)
  }

  private start_api(): Promise<void> {
    return this.server.start(config.api)
  }

  create_endpoints() {
    this.user_manager.create_all_endpoints(this.server.get_app())
  }

  start() {
    this.start_database()

    const schema = new Schema({
      "User": {
        "properties": {
          "username": {
            "type": "string",
            "unique": true
          },
          "password": {
            "type": "string"
          }
        }
      }
    })
    const modeler = new Modeler(this.db, schema)

    this.user_manager = new User_Manager(this.server.get_app(), this.db, {
      secret: 'test',
      user_model: modeler.collections.User
    })

    this.create_endpoints()
    return this.start_api()
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
