import * as assert from 'assert'
import {WebClient} from "vineyard-lawn/lab/web-client";
import {UserClient} from "../../lab/user-client";

require('source-map-support').install()

const request_original = require('request').defaults({jar: true, json: true})
const serverUrl = 'http://localhost:3000'

function get_2fa_token_from_url(secret: string) {
  const speakeasy = require("speakeasy")
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  })
}

describe('user-test', function () {
  let server: any
  this.timeout(5000)

  // function local_request(method: string, url: string, body?: any) {
  //   return request({
  //     url: "http://" + server.get_url() + '/' + url,
  //     method: method,
  //     body: body
  //   })
  // }

  // function login(username: string, password: string) {
  //   return local_request('post', 'user/login', {
  //     username: username,
  //     password: password
  //   })
  // }

  after(function () {
    // return server.stop()
  });

  it('login_success', async function () {
    // return local_request('get', 'ping')
    const webClient = new WebClient(serverUrl)
    const userClient = new UserClient(webClient, {
      identifier: {username: 'froggy'},
      password: 'test',
    })
    await userClient.login()
    // assert.equal('froggy', user.username);
    // assert.equal(undefined, user.password);
    console.log(server.user_manager)
    const sessionResult = await server.user_manager.Session_Model.findAll()
    assert.equal(1, result.length)
    // assert.equal(1, result.dataValues.user)
    await request({
      url: "http://" + server.get_url() + '/user/logout',
      method: 'post'
    })
    const result = await server.user_manager.Session_Model.findOne()
    assert(result);
    assert.equal(null, result.dataValues.user)
  });

  it('login_bad_username', function () {
    return login('froggy2', 'test')
      .then(function (user) {
        assert(false)
      })
      .catch(function () {
        assert(true)
      })
  })

  it('login_bad_password', function () {
    return login('froggy', 'test2')
      .then(function (user) {
        assert(false)
      })
      .catch(function () {
        assert(true)
      })
  })

  it('2fa', function () {
    return local_request('get', 'user/2fa')
      .then(response => {
        console.log('response', response)
        const token = get_2fa_token_from_url(response.secret)
        return local_request('post', 'user/2fa', {token: token})
          .then(response => {
            assert(true)
          })
      })
  })

  it('register user with 2fa', function () {
    return local_request('get', 'user/2fa')
      .then(response => {
        console.log('response', response)
        const token = get_2fa_token_from_url(response.secret)

        const data = {
          username: 'wizard-thief',
          password: 'Steals Wizards',
          token: token
        }

        return local_request('post', 'user', data)
          .then(response => {
            assert(true)
          })
      })
  })

  it('validate unique username', function () {
    return local_request('post', 'user', {
      username: 'froggy',
      password: 'test3'
    }).catch(response => {
      assert(true)
    })
  })
})