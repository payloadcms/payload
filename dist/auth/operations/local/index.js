"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = __importDefault(require("./login"));
const forgotPassword_1 = __importDefault(require("./forgotPassword"));
const resetPassword_1 = __importDefault(require("./resetPassword"));
const unlock_1 = __importDefault(require("./unlock"));
const verifyEmail_1 = __importDefault(require("./verifyEmail"));
exports.default = {
    login: login_1.default,
    forgotPassword: forgotPassword_1.default,
    resetPassword: resetPassword_1.default,
    unlock: unlock_1.default,
    verifyEmail: verifyEmail_1.default,
};
//# sourceMappingURL=index.js.map