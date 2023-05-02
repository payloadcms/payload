"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_anonymous_1 = __importDefault(require("passport-anonymous"));
const jwt_1 = __importDefault(require("./strategies/jwt"));
function initAuth(ctx) {
    passport_1.default.use(new passport_anonymous_1.default.Strategy());
    passport_1.default.use('jwt', (0, jwt_1.default)(ctx));
}
exports.default = initAuth;
//# sourceMappingURL=init.js.map