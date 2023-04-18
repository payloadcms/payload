"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAssociatedFiles = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fileExists_1 = __importDefault(require("./fileExists"));
const errors_1 = require("../errors");
const deleteAssociatedFiles = async ({ config, collectionConfig, files = [], doc, t, overrideDelete, }) => {
    if (!collectionConfig.upload)
        return;
    if (overrideDelete || files.length > 0) {
        const { staticDir } = collectionConfig.upload;
        const staticPath = path_1.default.resolve(config.paths.configDir, staticDir);
        const fileToDelete = `${staticPath}/${doc.filename}`;
        if (await (0, fileExists_1.default)(fileToDelete)) {
            fs_1.default.unlink(fileToDelete, (err) => {
                if (err) {
                    throw new errors_1.ErrorDeletingFile(t);
                }
            });
        }
        if (doc.sizes) {
            Object.values(doc.sizes)
                .forEach(async (size) => {
                const sizeToDelete = `${staticPath}/${size.filename}`;
                if (await (0, fileExists_1.default)(sizeToDelete)) {
                    fs_1.default.unlink(sizeToDelete, (err) => {
                        if (err) {
                            throw new errors_1.ErrorDeletingFile(t);
                        }
                    });
                }
            });
        }
    }
};
exports.deleteAssociatedFiles = deleteAssociatedFiles;
//# sourceMappingURL=deleteAssociatedFiles.js.map