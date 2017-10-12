import * as Sequelize from 'sequelize'
import {promiseEach} from "./utility";
import {Collection, Query} from "vineyard-ground"
import {User, User_With_Password} from "./User"

const bcrypt = require('bcrypt');

export interface Table_Keys {
  id: string
  username: string
  password: string
}

export interface Settings {
  user_model: any
  table_keys?: any
  model: any
}

export interface TempPassword {
  user: string
  password: string
  created: any
}

export interface EmailVerification {
  user: string
  code: string
}

interface Onetimecode {
  user: string
  code: string
  available: boolean
}

export class UserManager {
  db: Sequelize.Sequelize
  User_Model: Collection<User_With_Password>
  user_model: Collection<User_With_Password>
  private sessionCollection: any;
  private table_keys: Table_Keys;
  tempPasswordCollection: Collection<TempPassword>
  private emailVerificationCollection: Collection<EmailVerification>
  private oneTimeCodeCollection: Collection<Onetimecode>

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

    if (settings.model) {
      settings.model.ground.addDefinitions({
        "TempPassword": {
          "primary": "user",
          "properties": {
            "user": {
              "type": "guid"
            },
            "password": {
              "type": "string"
            }
          }
        },
        "EmailVerification": {
          "primary": "user",
          "properties": {
            "user": {
              "type": "User"
            },
            "code": {
              "type": "string"
            }
          }
        },
        "Onetimecode": {
          "properties": {
            "user": {
              "type": "User"
            },
            "code": {
              "type": "string"
            },
            "available": {
              "type": "bool"
            }
          }
        },
      })

      this.tempPasswordCollection = settings.model.TempPassword
      this.emailVerificationCollection = settings.model.ground.collections.EmailVerification
      this.oneTimeCodeCollection = settings.model.ground.collections.Onetimecode
    }
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  prepareNewUser(fields: any) {
    if (!fields.roles && (this.User_Model as any).trellis.properties.roles)
      fields.roles = [];

    if (typeof fields.email === 'string')
      fields.email = fields.email.toLowerCase()

    return this.hashPassword(fields.password)
      .then(salt_and_hash => {
        fields.password = salt_and_hash;
        return fields
      })
  }

  prepare_new_user(fields: any) {
    return this.prepareNewUser(fields)
  }

  create_user(fields: any, uniqueField: string | string[] = 'username'): Promise<any> {
    return this.createUser(fields, uniqueField)
  }

  createUser(fields: any, uniqueField: string | string[] = 'username'): Promise<any> {
    // this.sanitizeRequest(fields)
    const uniqueFields = Array.isArray(uniqueField) ? uniqueField : [uniqueField]
    return promiseEach(uniqueFields, (field: any) => this.checkUniqueness(fields, field))
      .then(() => {
        return this.prepare_new_user(fields)
          .then(user => this.User_Model.create(fields))
      })
  }

  getUser(id: { id: string } | string): Promise<User_With_Password | undefined> {
    return this.User_Model.get(id).exec()
  }

  getSessionCollection() {
    return this.sessionCollection
  }

  getUserCollection() {
    return this.user_model
  }

  getOneTimeCodeCollection() {
    return this.oneTimeCodeCollection
  }

  private validateParameters(request: { username: string }) {
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

  private tempPasswordHasExpired(tempPassword: TempPassword): boolean {
    const expirationDate = new Date(tempPassword.created.getTime() + (6 * 60 * 60 * 1000))
    return new Date() > expirationDate
  }

  private emailCodeHasExpired(emailCode: { created: Date }): boolean {
    const expirationDate = new Date(emailCode.created.getTime() + (6 * 60 * 60 * 1000))
    return new Date() > expirationDate
  }

  matchTempPassword(user: User, password: string): Promise<boolean> {
    if (!this.tempPasswordCollection)
      return Promise.resolve(false)

    return this.tempPasswordCollection.first({user: user.id})
      .then((storedTempPass: any) => {
        if (!storedTempPass)
          return false

        if (this.tempPasswordHasExpired(storedTempPass))
          return this.tempPasswordCollection.remove(storedTempPass)
            .then(() => false)

        return bcrypt.compare(password, storedTempPass.password)
          .then((success: boolean) => {
            if (!success)
              return false

            return this.getUserCollection().update(user, {
              password: storedTempPass.password
            })
              .then(() => this.tempPasswordCollection.remove(storedTempPass))
              .then(() => true)
          })
      })
  }

  createTempPassword(username: string): Promise<any> {
    return this.user_model.first({username: username})
      .then((user?: User) => {
        if (!user)
          throw new Error("Invalid username: " + username)

        return this.getTempPassword(user)
          .then(tempPassword => {
            if (!tempPassword) {
              const passwordString = Math.random().toString(36).slice(2)
              return this.hashPassword(passwordString)
                .then(hashedPassword => this.tempPasswordCollection.create({
                    user: user,
                    password: hashedPassword
                  })
                )
                .then(() => {
                  return {
                    password: passwordString,
                    username: user.username
                  }
                })
            } else {
              return Promise.resolve(undefined)
            }
          })
      })
  }

  createEmailCode(user: User): Promise<any> {
    return this.getEmailCode(user)
      .then(emailCode => {
        if (!emailCode) {
          const newEmlCode = Math.random().toString(36).slice(2)
          return this.emailVerificationCollection.create({
            user: user,
            code: newEmlCode
          })
            .then(() => newEmlCode)
        } else {
          return Promise.resolve(emailCode.code)
        }
      })
  }

  verifyEmailCode(userId: string, submittedCode: string): Promise<boolean> {
    return this.user_model.first({id: userId}).exec()
      .then(user => {
        if (!user)
          return false

        return this.emailVerificationCollection.first({
          user: userId
        })
          .then(emailCode => {
            if (!emailCode || emailCode.code != submittedCode)
              return Promise.resolve(false)

            return this.user_model.update(user, {
              emailVerified: true
            })
            // .then(() => this.emailVerificationCollection.remove(emailCode))
              .then(() => true)
          })
      })
  }

  getEmailCode(user: User) {
    return this.emailVerificationCollection.first({user: user.id}).exec()
  }

  getTempPassword(user: User) {
    return this.tempPasswordCollection.first({user: user.id}).exec()
  }

  getUserOneTimeCode(user) {
    return this.oneTimeCodeCollection.first({user: user.id, available: true})
  }

  private sanitizeRequest(request: any) {
    const check = this.validateParameters(request);
    if (check.valid !== true) {
      throw new Error(`Parameters contain the following invalid characters ${check.invalidChars}`)
    }
  }

  fieldExists(key: string, value: any): Promise<boolean> {
    const filter: any = {}
    filter[key] = value
    return this.User_Model.first(filter).exec()
      .then((user?: User) => !!user)
  }

  compareOneTimeCode(oneTimeCode, codeRecord) {
    if(!oneTimeCode || !codeRecord) {
      return Promise.resolve(false)
    }
    return bcrypt.compare(oneTimeCode, codeRecord.code).then(success => {
      if (!success)
        return false

      return true
    })
  }

  setOneTimeCodeToUnavailable(oneTimeCode) {
    return this.oneTimeCodeCollection.first({ code: oneTimeCode}).then(codeRecord =>
      this.oneTimeCodeCollection.update(oneTimeCode.id, { available: false })
    )
  }

  createOneTimeCodeForUser(userId) {
    const randomNumber = () => Math.floor(Math.random() * 10).toString()
    const randomCode = randomNumber() + randomNumber() + randomNumber() + randomNumber() + randomNumber() + randomNumber()
    console.log(randomCode)
    return bcrypt.hash(randomCode, 10).then(saltedRandomCode =>
      this.oneTimeCodeCollection.create({
        user: userId,
        code: saltedRandomCode,
        available: true
      })
    )
  }

  checkUniqueness(user: User, field = 'username') {
    return this.fieldExists(field, user[field])
      .then(result => {
        if (result) {
          throw new Error(`User validation error: ${field} must be unique`)
        }
      })
  }

  getTempPasswordCollection() {
    return this.tempPasswordCollection
  }
}

export class User_Manager extends UserManager {
  constructor(db: Sequelize.Sequelize, settings: Settings) {
    super(db, settings)
  }
}
