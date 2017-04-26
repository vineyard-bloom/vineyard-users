"use strict";
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
