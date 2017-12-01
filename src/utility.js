"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function has_role(user, role) {
    let role_id;
    if (typeof role == 'number') {
        role_id = role;
    }
    else if (typeof role == 'object') {
        role_id = role.id;
    }
    else {
        throw Error("Invalid role type: " + (typeof role) + ".");
    }
    const roles = user.roles;
    for (let i = 0; i < roles.length; ++i) {
        if (roles[i].id == role_id) {
            return true;
        }
    }
    return false;
}
exports.has_role = has_role;
function has_any_role(user, roles) {
    for (let i = 0; i < roles.length; ++i) {
        if (has_role(user, roles[i]))
            return true;
    }
    return false;
}
exports.has_any_role = has_any_role;
function promiseEach(items, action) {
    if (items.length == 0)
        return Promise.resolve();
    let result = action(items[0]);
    for (let i = 1; i < items.length; ++i) {
        result = result
            .then(() => action(items[i]));
    }
    return result;
}
exports.promiseEach = promiseEach;
//# sourceMappingURL=utility.js.map