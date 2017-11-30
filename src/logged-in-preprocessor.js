"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vineyard_lawn_1 = require("vineyard-lawn");
var LoggedInPreprocessor = (function (_super) {
    __extends(LoggedInPreprocessor, _super);
    function LoggedInPreprocessor(versions) {
        return _super.call(this, versions) || this;
    }
    LoggedInPreprocessor.prototype.createAnonymous = function () {
        var _this = this;
        return function (request) { return _this.common(request); };
    };
    LoggedInPreprocessor.prototype.createAuthorized = function (userService) {
        var _this = this;
        return function (request) { return _this.common(request)
            .then(function (request) {
            userService.require_logged_in(request);
            return request;
        }); };
    };
    return LoggedInPreprocessor;
}(vineyard_lawn_1.VersionPreprocessor));
exports.LoggedInPreprocessor = LoggedInPreprocessor;
//# sourceMappingURL=logged-in-preprocessor.js.map