"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkTempFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const mapAsync_1 = require("../utilities/mapAsync");
const unlinkFile = (0, util_1.promisify)(fs_1.default.unlink);
/**
 * Remove temp files if enabled, as express-fileupload does not do this automatically
 */
const unlinkTempFiles = async ({ req, config, collectionConfig, }) => {
    var _a;
    if (((_a = config.upload) === null || _a === void 0 ? void 0 : _a.useTempFiles) && collectionConfig.upload) {
        const { files } = req;
        const fileArray = Array.isArray(files) ? files : [files];
        await (0, mapAsync_1.mapAsync)(fileArray, async ({ file }) => {
            // Still need this check because this will not be populated if using local API
            if (file.tempFilePath) {
                await unlinkFile(file.tempFilePath);
            }
        });
    }
};
exports.unlinkTempFiles = unlinkTempFiles;
//# sourceMappingURL=unlinkTempFiles.js.map