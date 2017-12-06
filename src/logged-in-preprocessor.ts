import {Request, Bad_Request, RequestProcessor, Version, VersionPreprocessor} from 'vineyard-lawn'
import {UserService} from "./user-service";

export class LoggedInPreprocessor extends VersionPreprocessor {

  constructor(versions: Version []) {
    super(versions)
  }

  createAnonymous(): RequestProcessor {
    return request => this.common(request)
  }

  createAuthorized(userService: UserService): RequestProcessor {
    return request => this.common(request)
      .then(request => {
        userService.require_logged_in(request)
        return request
      })
  }
}
