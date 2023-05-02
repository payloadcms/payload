"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class AuthenticationError extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:emailOrPasswordIncorrect') : 'The email or password provided is incorrect.', http_status_1.default.UNAUTHORIZED);
    }
}
exports.default = AuthenticationError;
//# sourceMappingURL=AuthenticationError.js.map