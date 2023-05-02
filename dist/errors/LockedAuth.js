"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class LockedAuth extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:userLocked') : 'This user is locked due to having too many failed login attempts.', http_status_1.default.UNAUTHORIZED);
    }
}
exports.default = LockedAuth;
//# sourceMappingURL=LockedAuth.js.map