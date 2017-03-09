"use strict";
var session = require('express-session');
var mongo_store = require('connect-mongo')(session);
var vineyard_lawn_1 = require('vineyard-lawn');
var lawn = require('vineyard-lawn');
var mongoose = require('mongoose');
var passport_local_mongoose = require('passport-local-mongoose');
function initialize(app, mongoose_connection, settings) {
    app.use(session({
        secret: settings.secret,
        store: new mongo_store({ mongooseConnection: mongoose_connection }),
        cookie: { secure: true }
    }));
    var User = new mongoose.Schema(settings.user || {});
    User.plugin(passport_local_mongoose);
    module.exports = mongoose.model('User', User);
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
                return Promise.resolve();
            }
        }
    ]);
}
exports.initialize = initialize;
//# sourceMappingURL=index.js.map