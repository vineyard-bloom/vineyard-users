require('source-map-support').install()
import * as assert from 'assert'
import {WebClient} from "vineyard-lawn/lab/web-client";
import {UserClient} from "../../lab/user-client";
import {DevModeler, Schema, SequelizeClient, DatabaseClient} from "vineyard-ground"
import {UserManager, UserService} from "../../src"
import {TestServer} from "../src/test-server"
import { ServerConfig } from 'vineyard-lawn';

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

async function testSetup(client: SequelizeClient, url: string, api: ServerConfig): Promise<[WebClient, UserClient, UserManager, TestServer]> {
  const generalModel = await createGeneralModel(client)
  const sequelize = client.getLegacyDatabaseInterface()
  const userManager = new UserManager(sequelize as any, { model: generalModel })
  await generalModel.ground.regenerate()
  const server = new TestServer(userManager)
  const user = await userManager.createUser({ username: 'froggy', password: 'test', email: 'froggy@nowhere.com' })
  await server.start(api)
  const webClient = new WebClient(url)
  const userClient = new UserClient(webClient, { identifier: { username: 'froggy' }, password: 'test' })
  return [webClient, userClient, userManager, server]
}

describe('user-test', function () {
  this.timeout(9000)

  after(function () {
    // return server.stop()
  });

  it('login_success', async function () {
    // return local_request('get', 'ping')
    // const generalModel = await createGeneralModel(databaseClient)
    // const sequelize = databaseClient.getLegacyDatabaseInterface()
    // const userManager = new UserManager(sequelize as any, {
    //   model: generalModel
    // })

    // await generalModel.ground.regenerate()

    // const server = new TestServer(userManager)
    // const user = await userManager.createUser({
    //   username: 'froggy',
    //   password: 'test',
    //   email: 'froggy@nowhere.com'
    // })
    // await server.start(config.api)
    // const webClient = new WebClient(serverUrl)
    // const userClient = new UserClient(webClient, {
    //   identifier: {username: 'froggy'},
    //   password: 'test',
    // })
    const [webClient, userClient, userManager, server] = await testSetup(databaseClient, serverUrl, config.api)

    await assertSessionCount(userManager, 0)

    await userClient.login()

    await assertSessionCount(userManager, 1)
    await userClient.logout()

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

  it('anonymous sessions are not created', async function () {
    const [webClient, userClient, userManager, server] = await testSetup(databaseClient, serverUrl, config.api)

    await assertSessionCount(userManager, 0)
    await webClient.get('ping')
    await assertSessionCount(userManager, 0)

    await server.stop()
  })

  it('sessions are different on the same web client between multiple logins', async function () {
    const [webClient, userClient, userManager, server] = await testSetup(databaseClient, serverUrl, config.api)

    await assertSessionCount(userManager, 0)
    await userClient.login()
    await assertSessionCount(userManager, 1)
    const session1 = await userManager.getSessionCollection().first().exec()
    await userClient.logout()
    await assertSessionCount(userManager, 0)
    await userClient.login()
    await assertSessionCount(userManager, 1)
    const session2 = await userManager.getSessionCollection().first().exec()
    assert.notEqual(session1.sid, session2.sid)

    await server.stop()
  })
})