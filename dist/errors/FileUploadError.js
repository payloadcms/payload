"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const APIError_1 = __importDefault(require("./APIError"));
class FileUploadError extends APIError_1.default {
    constructor(t) {
        super(t ? t('error:problemUploadingFile') : 'There was a problem while uploading the file.', http_status_1.default.BAD_REQUEST);
    }
}
exports.default = FileUploadError;
//# sourceMappingURL=FileUploadError.js.map