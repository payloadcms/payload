"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-classes-per-file */
const http_status_1 = __importDefault(require("http-status"));
/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor(message, status, data, isPublic) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.data = data;
        this.isPublic = isPublic;
        this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Couldn't get the compiler to love me
        Error.captureStackTrace(this, this.constructor.name);
    }
}
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {object} data - response data to be returned.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message, status = http_status_1.default.INTERNAL_SERVER_ERROR, data = null, isPublic = false) {
        super(message, status, data, isPublic);
    }
}
exports.default = APIError;
//# sourceMappingURL=APIError.js.map