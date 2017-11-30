import {Response_Generator, Bad_Request, create_endpoints, Method, Request} from "vineyard-lawn";
import {ValidationCompiler} from "vineyard-lawn";

const speakeasy = require("speakeasy")

const window = 2

export function createTwoFactorSecretResponse(): Response_Generator {
  return request => {
    const secret = speakeasy.generateSecret()
    return Promise.resolve({
      secret: secret.base32,
      secret_url: secret.otpauth_url // deprecated
    })
  }
}
module.exports.get_2fa_token = createTwoFactorSecretResponse

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: window
  })
}
module.exports.verify_2fa_token = verifyTwoFactorToken

export function verifyTwoFactorRequest(request: Request): string {
  const twoFactorSecret = request.data.twoFactorSecret

  if (!twoFactorSecret)
    throw new Bad_Request("Two Factor secret must be generated before verifying.", {key: "no-2-fa"})

  if (verifyTwoFactorToken(twoFactorSecret, request.data.twoFactorToken || request.data.twoFactor)) {
    return twoFactorSecret
  }

  throw new Bad_Request("Invalid Two Factor secret.", {key: "invalid-2fa"})
}
module.exports.verify_2fa_request = verifyTwoFactorRequest

export function verifyTwoFactorTokenHandler(): Response_Generator {
  return request => {
    verifyTwoFactorRequest(request)
    return Promise.resolve({
      message: "Verification succeeded."
    })
  }
}
module.exports.verify_2fa_token_handler = verifyTwoFactorTokenHandler

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
      action: createTwoFactorSecretResponse(),
      validator: this.validators.empty
    }
  }

  verifyToken() {
    return {
      method: Method.post,
      path: "user/2fa",
      action: verifyTwoFactorTokenHandler(),
      validator: this.validators.verifyTwoFactor
    }
  }

  getValidators(): any {
    return this.validators
  }
}

export function initializeTwoFactor(server: any) {
  const endpoints = new TwoFactorEndpoints(server)

  server.createPublicEndpoints([

    endpoints.getNewSecret(),
    endpoints.verifyToken(),

  ])
  return {validators: endpoints.getValidators()}
}
