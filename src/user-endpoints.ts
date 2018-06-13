import { ValidationCompiler, EndpointInfo } from 'vineyard-lawn'
import { Method } from 'vineyard-lawn'
import { UserService, UserManager, ManagerSettings, CookieSettings } from '.'
import { SequelizeStore } from './session-store'
import * as express from 'express'

export type UserEndpointGenerator = {
  loginWithUsernameOrEmail: (path?: string) => EndpointInfo
  login2faWithBackup: (path?: string) => EndpointInfo
  logout: (path?: string) => EndpointInfo
}

export function createUserEndpointGenerator(userManager: UserManager, userService: UserService, validators: any): UserEndpointGenerator {
  return {
    loginWithUsernameOrEmail: (path = 'user/login') => createLoginWithUsernameOrEmailEndpoint(userService, path, validators),
    login2faWithBackup: (path = 'user/login') => createLoginWith2faBackupEndpoint(userService, path, validators),
    logout: (path = 'user/logout') => createLogoutEndpoint(userService, path, validators),
  }
}

function createLoginWithUsernameOrEmailEndpoint(userService: UserService, path: string, validators): EndpointInfo {
  return {
    method: Method.post,
    path: path,
    action: userService.loginWithUsernameOrEmail,
    validators: validators.loginWithUsername
  }
}

function createLoginWith2faBackupEndpoint(userService: UserService, path: string, validators): EndpointInfo {
  return {
    method: Method.post,
    path: path,
    action: userService.login2faWithBackup,
    validators: validators.login2faWithBackup
  }
}

function createLogoutEndpoint(userService: UserService, path: string, validators): EndpointInfo {
  return {
    method: Method.post,
    path: path,
    action: userService.logout,
    validators: validators.logout
  }
}
