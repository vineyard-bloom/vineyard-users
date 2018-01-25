# Vineyard Users - UserService

#### Constructor

Parameters

*  app `express.Application` 
*  userManager `UserManager` 
*  cookie `CookieSettings` 
*  sessionStore `any` (*default*=` createDefaultSessionStore(userManager, cookie.maxAge, cookie.secure)`) 

Returns `UserService`

#### Functions

##### `addUserToRequest`


Parameters

*  request `Request` 

Returns `Promise`

##### `checkEmailLogin`


Parameters

*  request `Request` 

Returns `Promise`

##### `checkPassword`
Compares a plain text password with a salted password.

Parameters

*  password `string` Plain text password

*  hash `string` Salted password



Returns `Promise`

##### `checkTempPassword`


Parameters

*  user `BaseUser` 
*  password `string` 

Returns `Promise`

##### `checkTwoFactor`


Parameters

*  user `BaseUser` 
*  twoFactorCode `string` 

Returns `void`

##### `checkUsernameOrEmailLogin`
Checks login credentials using a password and a username or email

Parameters

*  request `Request` Vineyard Lawn request



Returns `Promise`

##### `consume2faOneTimeCode`
Searches for a matching, available one time code and consumes it if one is found for the provided user

Parameters

*  twoFactorCode `string` The one time code to check

*  user `BaseUser` The user attempting to use the one time code



Returns `Promise`

##### `createTempPassword`


Parameters

*  user `string` 

Returns `Promise`

##### `fieldExists`


Parameters

*  request `Request` 
*  fieldOptions `string[]` 

Returns `Promise`

##### `finishLogin`


Parameters

*  request `Request` 
*  user `UserWithPassword` 

Returns `BaseUser`

##### `getModel`


Returns `UserManager`

##### `getSanitizedUser`


Parameters

*  id `string` 

Returns `Promise`

##### `loadValidationHelpers`


Parameters

*  ajv `any` 

Returns `void`

##### `login2faWithBackup`


Parameters

*  twoFactorCode `string` 
*  request `Request` 

Returns `Promise`

##### `loginWithUsername`


Parameters

*  request `Request` 

Returns `Promise`

##### `logout`


Parameters

*  request `Request` 

Returns `Promise`

##### `require_logged_in`


Parameters

*  request `Request` 

Returns `void`

##### `verify2faOneTimeCode`
Wrapper for consume2faOneTimeCode that also sets session.oneTimeCodeUsed to true when
a one time code is consumed.

Parameters

*  twoFactorCode `string` The one time code to check

*  request `Request` Used to grabe the session which is mutated if the one time code is consumed

*  user `BaseUser` The user attempting to use the one time code



Returns `Promise`


