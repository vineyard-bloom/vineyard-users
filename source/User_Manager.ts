import * as Sequelize from 'sequelize'

const bcrypt = require('bcrypt');

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
  db: Sequelize.Sequelize;
  User_Model: any;
  user_model: any;
  private sessionCollection;
  private table_keys: Table_Keys;

  constructor(db: Sequelize.Sequelize, settings: Settings) {
    this.db = db;
    if (!settings)
      throw new Error("Missing settings argument.");

    if (!settings.user_model)
      throw new Error("Missing user_model settings argument.");

    this.table_keys = settings.table_keys || {
        id: "id",
        username: "username,",
        password: "password"
      }

    this.User_Model = this.user_model = settings.user_model

    this.sessionCollection = db.define('session', {
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
    if (!fields.roles && this.User_Model.trellis.properties.roles)
      fields.roles = [];

    return bcrypt.hash(fields.password, 10)
      .then(salt_and_hash => {
        fields.password = salt_and_hash;
        return fields
      })
  }

  create_user(fields, uniqueField?): Promise<any> {
    return this.createUser(fields, uniqueField)
  }

  createUser(fields, uniqueField):Promise<any> {
    this.sanitizeRequest(fields);
    return this.checkUniqueness(fields, uniqueField)
        .then(() => {
          return this.prepare_new_user(fields)
              .then(user => this.User_Model.create(fields))
        })
  }

  getUser(id): Promise<User_With_Password> {
    return this.User_Model.get(id)
  }

  getSessionCollection() {
    return this.sessionCollection
  }

  getUserCollection() {
    return this.user_model
  }

  private validateParameters(request) {
    const invalidUserChars = request.username.match(/[^\w_]/g);
    const invalidPassChars = request.username.match(/[^\w_\-?!]/g);
    return {
      valid: (!invalidUserChars && !invalidPassChars),
      invalidChars: {
        username: invalidUserChars,
        password: invalidPassChars
      }
    }
  }

  private sanitizeRequest(request) {
    const check = this.validateParameters(request);
    if (check.valid !== true) {
      throw new Error(`Parameters contain the following invalid characters ${check.invalidChars}`)
    }
  }

  private checkUniqueness(request, field='username') {
    const filter = {};
    filter[field] = request[field];
    return this.User_Model.first_or_null(filter)
        .then((user) => {
          if(user) {
            throw new Error(`User validation error: ${field} must be unique`)
          }
        })
  }
}



export class User_Manager extends UserManager {
  constructor(db: Sequelize.Sequelize, settings: Settings) {
    super(db, settings)
  }
}
