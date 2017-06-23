import {Response_Generator, Bad_Request, create_endpoints, Method, Request} from "vineyard-lawn";
const speakeasy = require("speakeasy")

const window = 2

export function get_2fa_token(): Response_Generator {
  return request => {
    const secret = speakeasy.generateSecret()
    request.session.two_factor_secret = secret.base32
    return Promise.resolve({
      secret: secret.base32,
      secret_url: secret.otpauth_url // deprecated
    })
  }
}

export function verify_2fa_token(secret, token): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    windows: window
  })
}

export function verify_2fa_request(request: Request): string {
  const two_factor_secret = request.data.twoFactorSecret || request.session.two_factor_secret

  if (!two_factor_secret)
    throw new Bad_Request("2FA secret must be generated before verifying a token.")

  if (speakeasy.totp.verify({
      secret: two_factor_secret,
      encoding: 'base32',
      token: request.data.twoFactorToken || request.data.twoFactor,
      window: window
    })) {

    return two_factor_secret
  }

  throw new Bad_Request("Verification failed.")
}

export function verify_2fa_token_handler(): Response_Generator {
  return request => {
    verify_2fa_request(request)
    return Promise.resolve({
      message: "Verification succeeded."
    })
  }
}

export function verify_token_and_save(user_model): Response_Generator {
  return request => {
    const secret = verify_2fa_request(request)
    return user_model.update(request.session.user, {
      two_factor_enabled: true,
      two_factor_secret: request.session.two_factor_secret
    })
  }
}

export function getTwoFactorToken(secret: string) {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  })
}

export function initializeTwoFactor(server) {
  const validators = server.compileApiSchema(require('./validation/two-factor.json'))

  server.createPublicEndpoints([

    {
      method: Method.get,
      path: "user/2fa",
      action: get_2fa_token()
    },

    {
      method: Method.post,
      path: "user/2fa",
      action: verify_2fa_token_handler(),
      validator: validators.verifyTwoFactor
    },

  ])
}