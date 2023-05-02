"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class ValidationError extends APIError_1.default {
    constructor(results, t) {
        const message = t ? t('error:followingFieldsInvalid', { count: results.length }) : `The following field${results.length === 1 ? ' is' : 's are'} invalid:`;
        super(`${message} ${results.map((f) => f.field).join(', ')}`, http_status_1.default.BAD_REQUEST, results);
    }
}
exports.default = ValidationError;
//# sourceMappingURL=ValidationError.js.map