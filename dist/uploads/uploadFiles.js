"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = void 0;
const errors_1 = require("../errors");
const saveBufferToFile_1 = __importDefault(require("./saveBufferToFile"));
const uploadFiles = async (payload, files, t) => {
    try {
        await Promise.all(files.map(async ({ buffer, path }) => {
            await (0, saveBufferToFile_1.default)(buffer, path);
        }));
    }
    catch (err) {
        payload.logger.error(err);
        throw new errors_1.FileUploadError(t);
    }
};
exports.uploadFiles = uploadFiles;
//# sourceMappingURL=uploadFiles.js.map