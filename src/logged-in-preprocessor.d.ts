import { Request, Version, VersionPreprocessor } from 'vineyard-lawn';
import { UserService } from "./user-service";
export declare class LoggedInPreprocessor extends VersionPreprocessor {
    constructor(versions: Version[]);
    createAnonymous(): (request: Request) => Promise<Request>;
    createAuthorized(userService: UserService): (request: Request) => Promise<Request>;
}
