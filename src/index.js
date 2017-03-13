"use strict";
var session = require('express-session');
var mongo_store = require('connect-mongo')(session);
var vineyard_lawn_1 = require('vineyard-lawn');
var lawn = require('vineyard-lawn');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
function initialize(app, mongoose_connection, settings) {
    app.use(session({
        secret: settings.secret,
        store: new mongo_store({ mongooseConnection: mongoose_connection }),
        cookie: { secure: true }
    }));
    var user_fields = settings.user || {};
    user_fields.username = String;
    user_fields.password = String;
    var User = new mongoose.Schema();
    module.exports = mongoose.model('User', User);
    function get_user(username) {
        return new Promise(function (resolve, reject) { return User.findOne({ username: username }); })
            .then(function (user) {
            if (user) {
                delete user.password;
            }
            return user;
        });
    }
    passport.use(new LocalStrategy(function (username, password, done) {
        User.findOne({ username: username })
            .then(function (user) {
            if (!user || user.password != password)
                throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
            delete user.password;
            done(null, user);
        });
    }));
    lawn.initialize_endpoints(app, [
        {
            method: vineyard_lawn_1.Method.get,
            path: "user",
            action: function (request) {
                return Promise.resolve();
            }
        },
        {
            method: vineyard_lawn_1.Method.post,
            path: "user/login",
            action: function (request) {
                passport.authenticate('local', function (error, user, info) {
                    if (error)
                        throw error;
                    if (!user)
                        throw new vineyard_lawn_1.HTTP_Error("Failed to login.");
                    request.logIn(user, function (error) {
                        if (error)
                            throw new vineyard_lawn_1.HTTP_Error("Failed to login.");
                        return {
                            message: "Login succeeeded."
                        };
                    });
                });
            }
        }
    ]);
}
exports.initialize = initialize;
//# sourceMappingURL=index.js.map