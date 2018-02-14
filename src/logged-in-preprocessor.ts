import {Request, Version, VersionPreprocessor} from 'vineyard-lawn'
import {UserService} from "./user-service";

export class LoggedInPreprocessor extends VersionPreprocessor {

  constructor(versions: Version []) {
    super(versions)
  }

  createAnonymous() {
    return (request: Request) => this.common(request)
  }

  createAuthorized(userService: UserService) {
    return (request: Request) => this.common(request)
      .then(request => {
        userService.require_logged_in(request)
        return request
      })
  }
}
