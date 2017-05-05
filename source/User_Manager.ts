import * as Sequelize from 'sequelize'
import * as two_factor from './two-factor'

const bcrypt = require('bcrypt')

export interface Table_Keys {
  id: string
  username: string
  password: string
}

export interface Settings {
  user_model
  table_keys?
}

export class UserManager {
  db: Sequelize.Sequelize
  User_Model: any
  user_model: any
  Session_Model
  table_keys: Table_Keys

  constructor(db: Sequelize.Sequelize, settings: Settings) {
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

    this.User_Model = this.user_model = settings.user_model

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
  }

  prepare_new_user(fields) {
    return bcrypt.hash(fields.password, 10)
      .then(salt_and_hash => {
        fields.password = salt_and_hash
        return fields
      })
  }

  create_user(fields): Promise<any> {
    return this.prepare_new_user(fields)
      .then(user => this.User_Model.create(fields))
  }

  create_user_with_2fa(request: lawn.Request): Promise<User> {
    const fields = request.data
    return this.prepare_new_user(fields)
      .then(user => {
        fields.two_factor_secret = two_factor.verify_2fa_request(request)
        fields.two_factor_enabled = true
        delete fields.token
        return this.User_Model.create(fields)
      })
  }

}

export class User_Manager extends UserManager {
  constructor(db: Sequelize.Sequelize, settings: Settings) {
    super(db, settings)
  }
}
