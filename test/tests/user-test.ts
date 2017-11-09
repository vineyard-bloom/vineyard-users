require('source-map-support').install()
import * as assert from 'assert'
import {WebClient} from "vineyard-lawn/lab/web-client";
import {UserClient} from "../../lab/user-client";
import {DevModeler, Schema, SequelizeClient, DatabaseClient} from "vineyard-ground"
import {UserManager, UserService} from "../../src"
import {TestServer} from "../src/test-server"

const serverUrl = 'http://localhost:3000/1.0'

function get_2fa_token_from_url(secret: string) {
  const speakeasy = require("speakeasy")
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  })
}

const config = require('../config/config.json')

const databaseClient = new SequelizeClient(config.database)

function createGeneralModel(client: DatabaseClient) {
  const modeler = new DevModeler(require('../src/schema.json'), client)
  const model: any = modeler.collections
  model.ground = modeler

  return model
}

async function assertSessionCount(userManager: UserManager, count: number) {
  const sessionResult = await userManager.getSessionCollection().all().exec()
  assert.equal(sessionResult.length, count)
}

describe('user-test', function () {
  let server: any
  this.timeout(5000)

  after(function () {
    // return server.stop()
  });

  it('login_success', async function () {
    // return local_request('get', 'ping')
    const generalModel = await createGeneralModel(databaseClient)
    const sequelize = databaseClient.getLegacyDatabaseInterface()
    const userManager = new UserManager(sequelize as any, {
      model: generalModel
    })

    await generalModel.ground.regenerate()

    const server = new TestServer(userManager)
    const user = await userManager.createUser({
      username: 'froggy',
      password: 'test',
      email: 'froggy@nowhere.com'
    })
    await server.start(config.api)
    const webClient = new WebClient(serverUrl)
    const userClient = new UserClient(webClient, {
      identifier: {username: 'froggy'},
      password: 'test',
    })

    await assertSessionCount(userManager, 0)
    await webClient.get('ping')
    await assertSessionCount(userManager, 1)

    await userClient.login()

    await assertSessionCount(userManager, 1)
    await userClient.logout()
    const result = await userManager.getSessionCollection().first().exec()
    assert(result);
    assert.equal(result.user, undefined)

    await server.stop()
  });

  it('login_bad_username', function () {
    // return login('froggy2', 'test')
    //   .then(function (user) {
    //     assert(false)
    //   })
    //   .catch(function () {
    //     assert(true)
    //   })
  })

  it('login_bad_password', function () {
    // return login('froggy', 'test2')
    //   .then(function (user) {
    //     assert(false)
    //   })
    //   .catch(function () {
    //     assert(true)
    //   })
  })

  it('2fa', function () {
    // return local_request('get', 'user/2fa')
    //   .then(response => {
    //     console.log('response', response)
    //     const token = get_2fa_token_from_url(response.secret)
    //     return local_request('post', 'user/2fa', {token: token})
    //       .then(response => {
    //         assert(true)
    //       })
    //   })
  })

  it('register user with 2fa', function () {
    // return local_request('get', 'user/2fa')
    //   .then(response => {
    //     console.log('response', response)
    //     const token = get_2fa_token_from_url(response.secret)
    //
    //     const data = {
    //       username: 'wizard-thief',
    //       password: 'Steals Wizards',
    //       token: token
    //     }
    //
    //     return local_request('post', 'user', data)
    //       .then(response => {
    //         assert(true)
    //       })
    //   })
  })

  it('validate unique username', function () {
    // return local_request('post', 'user', {
    //   username: 'froggy',
    //   password: 'test3'
    // }).catch(response => {
    //   assert(true)
    // })
  })
})