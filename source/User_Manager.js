"use strict";
var session = require('express-session');
var mongo_store = require('connect-mongo')(session);
var vineyard_lawn_1 = require('vineyard-lawn');
var lawn = require('vineyard-lawn');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User_Manager = (function () {
    function User_Manager(app, mongoose_connection, settings) {
        var _this = this;
        this.db = mongoose_connection;
        app.use(session({
            secret: settings.secret,
            store: new mongo_store({ mongooseConnection: this.db }),
            cookie: { secure: true },
            resave: false,
            saveUninitialized: false
        }));
        var user_fields = settings.user || {};
        user_fields.username = String;
        user_fields.password = String;
        var user_schema = new mongoose.Schema(user_fields);
        this.User_Model = mongoose.model('User', user_schema);
        passport.use(new LocalStrategy(function (username, password, done) {
            _this.User_Model.findOne({ username: username })
                .then(function (user) {
                if (!user || user.password != password)
                    throw new vineyard_lawn_1.Bad_Request('Incorrect username or password.');
                delete user.password;
                done(null, user);
            })
                .catch(function (error) { return done(error); });
        }));
        //   this.authenticate_middleware = function(req, res, next) {
        //     passport.authenticate('local', function(error, user, info) {
        //       if (error)
        //         return next(error)
        //
        //       if (!user)
        //         return next(new HTTP_Error("Failed to login."))
        //
        //       req.logIn(user, error => {
        //         if (error)
        //           return next(new HTTP_Error("Failed to login."))
        //
        //         return next()
        //       })
        //     })(req, res, next)
        //   }
        //
    }
    User_Manager.prototype.get_user = function (username) {
        var _this = this;
        return new Promise(function (resolve, reject) { return _this.User_Model.findOne({ username: username }); })
            .then(function (user) {
            if (user) {
                delete user.password;
            }
            return user;
        });
    };
    User_Manager.prototype.create_user = function (fields) {
        var user = new this.User_Model(fields);
        return user.save();
    };
    return User_Manager;
}());
exports.User_Manager = User_Manager;
function create_user_endpoint(app, overrides) {
    if (overrides === void 0) { overrides = {}; }
    lawn.create_endpoint_with_defaults(app, {
        method: vineyard_lawn_1.Method.get,
        path: "user",
        action: function (request) {
            return Promise.resolve();
        }
    }, overrides);
}
exports.create_user_endpoint = create_user_endpoint;
function create_login_endpoint(app, overrides) {
    if (overrides === void 0) { overrides = {}; }
    lawn.create_endpoint_with_defaults(app, {
        method: vineyard_lawn_1.Method.post,
        path: "user/login",
        action: function (request) {
            return Promise.resolve();
        }
    }, overrides);
}
exports.create_login_endpoint = create_login_endpoint;
//# sourceMappingURL=User_Manager.js.map