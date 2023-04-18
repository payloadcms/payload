"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class Forbidden extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:notAllowedToPerformAction') : 'You are not allowed to perform this action.', http_status_1.default.FORBIDDEN);
    }
}
exports.default = Forbidden;
//# sourceMappingURL=Forbidden.js.map