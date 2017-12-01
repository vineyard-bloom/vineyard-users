"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
class UserClient {
    constructor(webClient, info) {
        this.webClient = webClient;
        if (info) {
            this.userIdentifier = info.identifier;
            this.password = info.password;
        }
    }
    prepareTwoFactor() {
        return this.webClient.get('user/2fa')
            .then((data) => this.webClient.post('user/2fa', {
            twoFactor: src_1.getTwoFactorToken(data.secret),
            twoFactorSecret: data.secret
        })
            .then(() => this.twoFactorSecret = data.secret));
    }
    register(createUser) {
        this.userIdentifier = createUser;
        this.password = createUser.password;
        return this.prepareTwoFactor()
            .then(twoFactorSecret => {
            createUser.twoFactorSecret = twoFactorSecret;
            return this.webClient.post('user', createUser);
        })
            .then(user => {
            this.createUserResponse = user;
            return this.createUserResponse;
        });
    }
    login() {
        const data = Object.assign({
            password: this.password,
            twoFactor: src_1.getTwoFactorToken(this.twoFactorSecret)
        }, this.userIdentifier);
        return this.webClient.post('user/login', data);
    }
    loginWithUsername() {
        const userIdentifier = this.userIdentifier;
        return this.webClient.post('user/login', {
            username: userIdentifier.username,
            password: this.password,
            twoFactor: src_1.getTwoFactorToken(this.twoFactorSecret)
        });
    }
    loginWithEmail() {
        const userIdentifier = this.userIdentifier;
        return this.webClient.post('user/login', {
            email: userIdentifier.email,
            password: this.password,
            twoFactor: src_1.getTwoFactorToken(this.twoFactorSecret)
        });
    }
    logout() {
        return this.webClient.post('user/logout');
    }
    getWebClient() {
        return this.webClient;
    }
    getUserIdentifier() {
        return this.userIdentifier;
    }
}
exports.UserClient = UserClient;
//# sourceMappingURL=user-client.js.map