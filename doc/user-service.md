# Vineyard Users - UserService

### Constructor

Parameters

*  app `express.Application` 
*  userManager `UserManager` 
*  cookie `CookieSettings` 
*  sessionStore `any` (*default*=` createDefaultSessionStore(userManager, cookie.maxAge, cookie.secure)`) 

Returns `UserService`

### Functions

#### `addUserToRequest`


Parameters

*  request `Request` 

Returns `Promise`

#### `checkEmailLogin`


Parameters

*  request `Request` 

Returns `Promise`

#### `checkPassword`


Parameters

*  password `string` 
*  hash `string` 

Returns `Promise`

#### `checkTempPassword`


Parameters

*  user `BaseUser` 
*  password `string` 

Returns `Promise`

#### `checkTwoFactor`


Parameters

*  user `BaseUser` 
*  request `Request` 

Returns `void`

#### `checkUsernameOrEmailLogin`


Parameters

*  request `Request` 

Returns `Promise`

#### `createTempPassword`


Parameters

*  usernameOrUser `` 

Returns `Promise`

#### `fieldExists`


Parameters

*  request `Request` 
*  fieldOptions `string[]` 

Returns `Promise`

#### `finishLogin`


Parameters

*  request `Request` 
*  user `UserWithPassword` 

Returns `BaseUser`

#### `getModel`


Returns `UserManager`

#### `getSanitizedUser`


Parameters

*  id `string` 

Returns `Promise`

#### `loadValidationHelpers`


Parameters

*  ajv `any` 

Returns `void`

#### `login2faWithBackup`


Parameters

*  request `Request` 

Returns `Promise`

#### `loginWithUsername`


Parameters

*  request `Request` 

Returns `Promise`

#### `logout`


Parameters

*  request `Request` 

Returns `Promise`

#### `require_logged_in`


Parameters

*  request `Request` 

Returns `void`

#### `verify2faOneTimeCode`


Parameters

*  request `Request` 
*  user `BaseUser` 

Returns `Promise`


