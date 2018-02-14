# Vineyard Users - UserManager

#### Constructor

Parameters

*  db `Sequelize.Sequelize` 
*  settings `Settings` 

Returns `UserManager`

#### Functions

##### `checkUniqueness`


Parameters

*  user `BaseUser` 
*  field `string` (*default*=`"username"`) 

Returns `Promise`

##### `compareOneTimeCode`


Parameters

*  oneTimeCode `string` 
*  codeRecord `Onetimecode` 

Returns `Promise`

##### `createEmailCode`


Parameters

*  user `BaseUser` 

Returns `Promise`

##### `createTempPassword`


Parameters

*  user `string` 

Returns `Promise`

##### `createUser`
Saves a new user record to the database.
Hashes the password, ensures the email is lowercase, and ensures the user.roles is at least an empty array.

Parameters

*  userFields `any` Initial user object

*  uniqueFields `` (*default*=`"username"`) An array of user field names that must be unique.



Returns `Promise`

##### `fieldExists`


Parameters

*  key `string` 
*  value `any` 

Returns `Promise`

##### `getEmailCode`


Parameters

*  user `BaseUser` 

Returns `Promise`

##### `getOneTimeCodeCollection`


Returns `Collection`

##### `getSessionCollection`


Returns `any`

##### `getTempPassword`


Parameters

*  user `string` 

Returns `Promise`

##### `getTempPasswordCollection`


Returns `Collection`

##### `getUser`
Fetches a user from the database.
This function does not sanitize its result so it can return records with login info.

Parameters

*  id `` User identity string or object



Returns `Promise`

##### `getUserCollection`


Returns `Collection`

##### `getUserFromEmail`
Finds a user that has a particular email address.
This function does not sanitize its result so it can return records with login info.

Parameters

*  email `string` The value to search for



Returns `Promise`

##### `getUserFromUsername`
Finds a user that has a particular username.
This function does not sanitize its result so it can return records with login info.

Parameters

*  username `string` The value to search for



Returns `Promise`

##### `getUserModel`


Returns `Collection`

##### `getUserOneTimeCode`


Parameters

*  user `BaseUser` 

Returns `Promise`

##### `hashPassword`
Hashes a password using bcrypt.

Parameters

*  password `string` Plain text password



Returns `Promise`

##### `matchTempPassword`


Parameters

*  user `BaseUser` 
*  password `string` 

Returns `Promise`

##### `prepareNewUser`
Prepares a new user structure before being saved to the database.
Hashes the password, ensures the email is lowercase, and ensures the user.roles is at least an empty array.
This function is called by UserManager.createUser and rarely needs to be called directly.

Parameters

*  userFields `any` Initial user object



Returns `Promise`

##### `setOneTimeCodeToUnavailable`


Parameters

*  oneTimeCode `Onetimecode` 

Returns `Promise`

##### `verifyEmailCode`


Parameters

*  userId `string` 
*  submittedCode `string` 

Returns `Promise`


