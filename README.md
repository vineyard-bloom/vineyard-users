# Vineyard Users

Vineyard Users is a library that adds common user features to the Vineyard ecosystem.  It is built on top of [Vineyard Ground](https://github.com/silentorb/vineyard-ground) and [Vineyard Lawn](https://github.com/silentorb/vineyard-lawn).

## Features

* SQL session store.
* Salted password storage.
* User creation, logging in, and logging out.
* Two factor authentication.
* User roles.
* Password reset
* Email verification
 
## Structure

Vineyard Users is primarily divided into two parts:

1. **User Manager** - Provides basic initialization and storage of User and Session entities.

2. **User Service** - Provides user web service features.  Depends on the User Manager.

