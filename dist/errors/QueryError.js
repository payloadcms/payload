"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class QueryError extends APIError_1.default {
    constructor(results, t) {
        const message = t ? t('error:unspecific', { count: results.length }) : `The following path${results.length === 1 ? '' : 's'} cannot be queried:`;
        super(`${message} ${results.map((err) => err.path).join(', ')}`, http_status_1.default.BAD_REQUEST, results);
    }
}
exports.default = QueryError;
//# sourceMappingURL=QueryError.js.map