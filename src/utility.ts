import {Role, User} from "./User";

export type Role_Id_Parameter = Role | number

export function has_role(user: User, role: Role_Id_Parameter) {
  let role_id: number
  if (typeof role == 'number') {
    role_id = role
  }
  else if (typeof role == 'object') {
    role_id = role.id
  }
  else {
    throw Error("Invalid role type: " + (typeof role) + ".")
  }

  const roles = user.roles
  for (let i = 0; i < roles.length; ++i) {
    if (roles[i].id == role_id) {
      return true
    }
  }

  return false
}

export function has_any_role(user: User, roles: Role_Id_Parameter[]) {
  for (let i = 0; i < roles.length; ++i) {
    if (has_role(user, roles[i]))
      return true
  }

  return false
}

export function promiseEach(items: any[], action: any) {
  if (items.length == 0)
    return Promise.resolve()

  let result = action(items[0])
  for (let i = 1; i < items.length; ++i) {
    result = result
      .then(() => action(items[i]))
  }

  return result
}