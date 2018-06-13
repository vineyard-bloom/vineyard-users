import { Method, ValidationCompiler, EndpointInfo } from 'vineyard-lawn'
import { UserService, UserManager, ManagerSettings, CookieSettings } from '.'
import { SequelizeStore } from './session-store'
import * as express from 'express'
import { ValidateFunction } from 'ajv'

export type UserEndpointGenerator = {
  loginWithUsernameOrEmail: (path?: string) => EndpointInfo
  login2faWithBackup: (path?: string) => EndpointInfo
  logout: (path?: string) => EndpointInfo
}

export type UserEndpointValidators = {
  loginWithUsername: ValidateFunction
  login2faWithBackup: ValidateFunction
  empty: ValidateFunction
}

export function createUserEndpointGenerator(userManager: UserManager, userService: UserService, validators: UserEndpointValidators): UserEndpointGenerator {
  const defaultValidators = require('./validation/user.json')
  return {
    loginWithUsernameOrEmail: (path = 'user/login', validators = defaultValidators) => createLoginWithUsernameOrEmailEndpoint(userService, path, validators),
    login2faWithBackup: (path = 'user/login', validators = defaultValidators) => createLoginWith2faBackupEndpoint(userService, path, validators),
    logout: (path = 'user/logout', validators = defaultValidators) => createLogoutEndpoint(userService, path, validators),
  }
}

function createLoginWithUsernameOrEmailEndpoint(userService: UserService, path: string, validators: UserEndpointValidators): EndpointInfo {
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
    validators: validators.empty
  }
}
