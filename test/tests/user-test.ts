import * as assert from 'assert'
import {Server} from "../source/server"
import * as vineyard_mongoose from "vineyard-mongoose"

require('source-map-support').install()

const request_original = require('request').defaults({jar: true, json: true})

function request(options): Promise<any> {
  return new Promise(function(resolve, reject) {
    request_original(options, function(error, response, body) {
      if (error)
        reject(error)
      else if (response.statusCode != 200)
        reject(new Error(response.statusCode + " " + response.statusMessage))
      else
        resolve(body)
    })
  })
}

describe('user-test', function() {
  let server

  function login(username, password) {
    return request({
      url: "http://" + server.get_url() + '/user/login',
      method: 'post',
      body: {
        username: username,
        password: password
      }
    })
  }

  before(function() {
    server = new Server()
    return server.start()
      .then(() => {
        const db = server.get_db()
        return db.sync({force: true})
          .then(() => {
            return server.get_user_manager().create_user({username: 'froggy', password: 'test'})
          })
      })
  })

  after(function() {
    // return server.stop()
  })

  it('login_success', function() {
    return login('froggy', 'test')
      .then(function(user) {
        assert.equal('froggy', user.username)
        assert.equal(undefined, user.password)
        return server.user_manager.Session_Model.findOne()
          .then(result=> {
            assert(result)
            assert.equal(1, result.dataValues.user)
          })
      })
      .then(function() {
        return request({
          url: "http://" + server.get_url() + '/user/logout',
          method: 'post'
        })
      })
      .then(function() {
        return server.user_manager.Session_Model.findOne()
          .then(result=> {
            assert(result)
            assert.equal(null, result.dataValues.user)
          })
      })
  })

  it('login_bad_username', function() {
    return login('froggy2', 'test')
      .then(function(user) {
        assert(false)
      })
      .catch(function() {
        assert(true)
      })
  })

  it('login_bad_password', function() {
    return login('froggy', 'test2')
      .then(function(user) {
        assert(false)
      })
      .catch(function() {
        assert(true)
      })
  })

})