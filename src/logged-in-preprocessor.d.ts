import { RequestProcessor, Version, VersionPreprocessor } from 'vineyard-lawn';
import { UserService } from "./user-service";
export declare class LoggedInPreprocessor extends VersionPreprocessor {
    constructor(versions: Version[]);
    createAnonymous(): RequestProcessor;
    createAuthorized(userService: UserService): RequestProcessor;
}
