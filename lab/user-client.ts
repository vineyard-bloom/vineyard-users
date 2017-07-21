import {WebClient} from "vineyard-lawn/lab"
import {getTwoFactorToken} from "../src"

export interface User {
  username: string
  password?: string
}

export class UserClient {
  private webClient: WebClient
  private user: User
  private password: string
  private twoFactorSecret: string

  constructor(webClient: WebClient) {
    this.webClient = webClient;
  }

  prepareTwoFactor(): Promise<string> {
    return this.webClient.get('user/2fa')
      .then(data => this.webClient.post('user/2fa', {
          twoFactor: getTwoFactorToken(data.secret)
        })
          .then(() => this.twoFactorSecret = data.secret)
      )
  }

  register(user: any): Promise<User> {
    this.password = user.password
    user.twoFactorSecret = this.twoFactorSecret
    return this.prepareTwoFactor()
      .then(twoFactorSecret => this.webClient.post('user', user))
      .then(user => this.user = user)
  }

  login(): Promise<void> {
    return this.webClient.post('user/login', {
      username: this.user.username,
      password: this.password,
      twoFactor: getTwoFactorToken(this.twoFactorSecret)
    })
  }

  logout(): Promise<void> {
    return this.webClient.post('user/logout')
  }

  getWebClient(): WebClient {
    return this.webClient
  }

  getUser(): User {
    return this.user
  }

}