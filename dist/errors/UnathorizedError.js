"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class UnauthorizedError extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:unauthorized') : 'Unauthorized, you must be logged in to make this request.', http_status_1.default.UNAUTHORIZED);
    }
}
exports.default = UnauthorizedError;
//# sourceMappingURL=UnathorizedError.js.map