"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class NotFound extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:notFound') : 'The requested resource was not found.', http_status_1.default.NOT_FOUND);
    }
}
exports.default = NotFound;
//# sourceMappingURL=NotFound.js.map