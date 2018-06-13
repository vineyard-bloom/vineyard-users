"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
const errors_1 = require("vineyard-lawn/source/errors");
const bcrypt = require('bcrypt');
class UserManager {
    constructor(db, settings) {
        this.db = db;
        if (!settings)
            throw new Error("Missing settings argument.");
        const self = this;
        this.userModel = self.UserModel = self.User_Model = self.user_model =
            settings.user_model || settings.model.User;
        if (settings.model) {
            settings.model.ground.addDefinitions({
                "Session": {
                    "primaryKeys": ["sid"],
                    "properties": {
                        "sid": {
                            "type": "string"
                        },
                        "user": {
                            "type": "uuid",
                            "nullable": true
                        },
                        "expires": {
                            "type": "datetime"
                        },
                        "data": {
                            "type": "string"
                        }
                    }
                },
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
            });
            const collections = settings.model.ground.collections;
            this.sessionCollection = collections.Session;
            this.tempPasswordCollection = collections.TempPassword;
            this.emailVerificationCollection = collections.EmailVerification;
            this.oneTimeCodeCollection = collections.Onetimecode;
        }
        // Backwards compatibility
        self.create_user = this.createUser;
        self.prepare_new_user = this.prepareNewUser;
    }
    getUserModel() {
        return this.userModel;
    }
    /**
     * Hashes a password using bcrypt.
     *
     * @param password  Plain text password
     *
     */
    hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    /**
     * Prepares a new user structure before being saved to the database.
     * Hashes the password, ensures the email is lowercase, and ensures the user.roles is at least an empty array.
     * This function is called by UserManager.createUser and rarely needs to be called directly.
     *
     * @param userFields  Initial user object
     *
     */
    prepareNewUser(userFields) {
        if (!userFields.roles && this.userModel.trellis.properties.roles)
            userFields.roles = [];
        if (typeof userFields.email === 'string')
            userFields.email = userFields.email.toLowerCase();
        return this.hashPassword(userFields.password)
            .then(salt_and_hash => {
            userFields.password = salt_and_hash;
            return userFields;
        });
    }
    /**
     * Saves a new user record to the database.
     * Hashes the password, ensures the email is lowercase, and ensures the user.roles is at least an empty array.
     *
     * @param userFields  Initial user object
     *
     * @param uniqueFields  An array of user field names that must be unique.
     *
     */
    createUser(userFields, uniqueFields = 'username') {
        const _uniqueFields = Array.isArray(uniqueFields) ? uniqueFields : [uniqueFields];
        return utility_1.promiseEach(_uniqueFields, (field) => this.checkUniqueness(userFields, field))
            .then(() => {
            return this.prepareNewUser(userFields)
                .then(user => this.userModel.create(userFields));
        });
    }
    /**
     * Fetches a user from the database.
     * This function does not sanitize its result so it can return records with login info.
     *
     * @param id  User identity string or object
     *
     */
    getUser(id) {
        return this.userModel.get(id).exec();
    }
    getSessionCollection() {
        return this.sessionCollection;
    }
    getUserCollection() {
        return this.userModel;
    }
    getOneTimeCodeCollection() {
        return this.oneTimeCodeCollection;
    }
    tempPasswordHasExpired(tempPassword) {
        const expirationDate = new Date(tempPassword.created.getTime() + (6 * 60 * 60 * 1000));
        return new Date() > expirationDate;
    }
    emailCodeHasExpired(emailCode) {
        const expirationDate = new Date(emailCode.created.getTime() + (6 * 60 * 60 * 1000));
        return new Date() > expirationDate;
    }
    matchTempPassword(user, password) {
        if (!this.tempPasswordCollection)
            return Promise.resolve(false);
        return this.tempPasswordCollection.first({ user: user.id })
            .then((storedTempPass) => {
            if (!storedTempPass)
                return false;
            if (this.tempPasswordHasExpired(storedTempPass))
                return this.tempPasswordCollection.remove(storedTempPass)
                    .then(() => false);
            return bcrypt.compare(password, storedTempPass.password)
                .then((success) => {
                if (!success)
                    return false;
                return this.getUserCollection().update(user, {
                    password: storedTempPass.password
                })
                    .then(() => this.tempPasswordCollection.remove(storedTempPass))
                    .then(() => true);
            });
        });
    }
    /**
     * Finds a user that has a particular username.
     * This function does not sanitize its result so it can return records with login info.
     *
     * @param username  The value to search for
     *
     */
    getUserFromUsername(username) {
        return this.userModel.first({ username: username })
            .then(user => {
            if (!user)
                throw new errors_1.BadRequest("Invalid username: " + username);
            return user;
        });
    }
    /**
     * Finds a user that has a particular email address.
     * This function does not sanitize its result so it can return records with login info.
     *
     * @param email  The value to search for
     *
     */
    getUserFromEmail(email) {
        return this.userModel.first({ email: email })
            .then(user => {
            if (!user)
                throw new errors_1.BadRequest("Invalid email: " + email);
            return user;
        });
    }
    createTempPassword(user) {
        return this.getTempPassword(user)
            .then(tempPassword => {
            if (!tempPassword) {
                const passwordString = Math.random().toString(36).slice(2);
                return this.hashPassword(passwordString)
                    .then(hashedPassword => this.tempPasswordCollection.create({
                    user: user,
                    password: hashedPassword
                }))
                    .then(() => {
                    return {
                        password: passwordString
                    };
                });
            }
            else {
                return Promise.resolve(undefined);
            }
        });
    }
    createEmailCode(user) {
        return this.getEmailCode(user)
            .then(emailCode => {
            if (!emailCode) {
                const newEmlCode = Math.random().toString(36).slice(2);
                return this.emailVerificationCollection.create({
                    user: user,
                    code: newEmlCode
                })
                    .then(() => newEmlCode);
            }
            else {
                return Promise.resolve(emailCode.code);
            }
        });
    }
    verifyEmailCode(userId, submittedCode) {
        return this.userModel.first({ id: userId }).exec()
            .then(user => {
            if (!user)
                return false;
            return this.emailVerificationCollection.first({
                user: userId
            })
                .then(emailCode => {
                if (!emailCode || emailCode.code != submittedCode)
                    return Promise.resolve(false);
                return this.userModel.update(user, {
                    emailVerified: true
                })
                    // .then(() => this.emailVerificationCollection.remove(emailCode))
                    .then(() => true);
            });
        });
    }
    getEmailCode(user) {
        return this.emailVerificationCollection.first({ user: user.id }).exec();
    }
    getTempPassword(user) {
        return this.tempPasswordCollection.first({ user: user }).exec();
    }
    getUserOneTimeCode(user) {
        return this.oneTimeCodeCollection.first({ user: user.id, available: true }).exec();
    }
    fieldExists(key, value) {
        const filter = {};
        filter[key] = value;
        return this.userModel.first(filter).exec()
            .then((user) => !!user);
    }
    compareOneTimeCode(oneTimeCode, codeRecord) {
        return Promise.resolve(oneTimeCode === codeRecord.code);
    }
    setOneTimeCodeToUnavailable(oneTimeCode) {
        return this.oneTimeCodeCollection.update(oneTimeCode, { available: false });
    }
    checkUniqueness(user, field = 'username') {
        return this.fieldExists(field, user[field])
            .then(result => {
            if (result) {
                throw new Error(`User validation error: ${field} must be unique`);
            }
        });
    }
    getTempPasswordCollection() {
        return this.tempPasswordCollection;
    }
}
exports.UserManager = UserManager;
module.exports.User_Manager = UserManager;
//# sourceMappingURL=user-manager.js.map