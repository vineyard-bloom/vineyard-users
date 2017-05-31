"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function has_role(user, role) {
    var role_id;
    if (typeof role == 'number') {
        role_id = role;
    }
    else if (typeof role == 'object') {
        role_id = role.id;
    }
    else {
        throw Error("Invalid role type: " + (typeof role) + ".");
    }
    var roles = user.roles;
    for (var i = 0; i < roles.length; ++i) {
        if (roles[i].id == role_id) {
            return true;
        }
    }
    return false;
}
exports.has_role = has_role;
function has_any_role(user, roles) {
    for (var i = 0; i < roles.length; ++i) {
        if (has_role(user, roles[i]))
            return true;
    }
    return false;
}
exports.has_any_role = has_any_role;
function promiseEach(items, action) {
    if (items.length == 0)
        return Promise.resolve();
    var result = action(items[0]);
    var _loop_1 = function (i) {
        result = result
            .then(function () { return action(items[i]); });
    };
    for (var i = 1; i < items.length; ++i) {
        _loop_1(i);
    }
    return result;
}
exports.promiseEach = promiseEach;
//# sourceMappingURL=utility.js.map