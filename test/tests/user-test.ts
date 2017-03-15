import * as assert from 'assert'
import {Server} from "../source/server"
import * as vineyard_mongoose from "vineyard-mongoose"

const request_original = require('request')

function request(options): Promise<any> {
  return new Promise(function(resolve, reject) {
    options.jar = true
    options.json = true
    request_original(options, function(error, response, body) {
      if (error)
        reject(error)
        else if(response.statusCode != 200)
          reject(new Error(response.statusCode + " " + response.statusMessage))
      else
        resolve(body)
    })
  })
}

describe('User_Test', function() {
  let server

  before(function() {
    server = new Server()
    return server.start()
      .then(() => {
        const db = server.get_db()
        return vineyard_mongoose.clear_database(db)
          .then(() => {
            return server.get_user_manager().create_user({username: 'froggy', password: 'test'})
          })
      })
  })

  after(function() {
    // return server.stop()
  })

  it('general', function() {
    return request({
      url: "http://" + server.get_url() + '/user/login',
      method: 'post',
      body: {
        username: 'froggy',
        password: 'test'
      }
    })
      .then(function(user) {
        assert.equal('froggy', user.username)
        assert.equal(undefined, user.password)
      })
  })
})