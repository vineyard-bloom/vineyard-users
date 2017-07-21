import {Response_Generator, Bad_Request, create_endpoints, Method, Request} from "vineyard-lawn";
import {ValidationCompiler} from "../../vineyard-lawn/source/types";
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
    window: window
  })
}

export function verify_2fa_request(request: Request): string {
  const two_factor_secret = request.data.twoFactorSecret || request.session.two_factor_secret

  if (!two_factor_secret)
    throw new Bad_Request("2FA secret must be generated before verifying a token.")

  if (verify_2fa_token(two_factor_secret, request.data.twoFactorToken || request.data.twoFactor)) {
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

export class TwoFactorEndpoints {
  private validators: any

  constructor(compiler: ValidationCompiler) {
    this.validators = compiler.compileApiSchema(require('./validation/two-factor.json'))
  }

  getNewSecret() {
    return {
      method: Method.get,
      path: "user/2fa",
      action: get_2fa_token(),
      validator: this.validators.empty
    }
  }

  verifyToken() {
    return {
      method: Method.post,
      path: "user/2fa",
      action: verify_2fa_token_handler(),
      validator: this.validators.verifyTwoFactor
    }
  }

  getValidators(): any {
    return this.validators
  }
}

export function initializeTwoFactor(server) {
  const endpoints = new TwoFactorEndpoints(server)

  server.createPublicEndpoints([

    endpoints.getNewSecret(),
    endpoints.verifyToken(),

  ])
  return {validators: endpoints.getValidators()}
}
