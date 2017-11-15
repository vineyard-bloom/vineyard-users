import {Method, Request, Server, Version} from "vineyard-lawn"
import {UserService, LoggedInPreprocessor} from "../../src";
import {UserManager} from "../../src/user-manager";

export class TestServer extends Server {
  preprocessor = new LoggedInPreprocessor([new Version("1.0")])
  userService: UserService

  constructor(userManager: UserManager) {
    super()
    this.userService = new UserService(this.getApp(), userManager, {
      "secret": "test",
      "maxAge": 900000,
      "secure": false,
      "rolling": true
    })
    this.userService.loadValidationHelpers(this.getApiSchema())
    this.initializeEndpoints()
  }

  async login(request: Request): Promise<any> {
    return this.userService.loginWithUsername(request)
  }

  async logout(request: Request): Promise<any> {
    return this.userService.logout(request)
  }

  async getUser(request: Request): Promise<any> {
    return this.userService.getSanitizedUser(request.session.user)
  }

  initializeEndpoints() {
    const authorized = this.preprocessor.createAuthorized(this.userService)
    const anonymous = this.preprocessor.createAnonymous()
    const validators = this.compileApiSchema(require('./api-validation.json'))

    this.createEndpoints(anonymous, [

      {
        method: Method.get,
        path: 'ping',
        action: request => Promise.resolve({}),
        validator: validators.empty
      },

      {
        method: Method.post,
        path: 'user/login',
        action: request => this.login(request),
        validator: validators.login
      },

    ])

    this.createEndpoints(authorized, [
      {
        method: Method.post,
        path: 'user/logout',
        action: request => this.logout(request),
        validator: validators.empty
      },

      {
        method: Method.get,
        path: 'user',
        action: request => this.getUser(request),
        validator: validators.empty
      },

    ])

  }
}