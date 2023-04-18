"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const file_type_1 = require("file-type");
const path_1 = __importDefault(require("path"));
const getFileByPath = async (filePath) => {
    if (typeof filePath === 'string') {
        const data = fs_1.default.readFileSync(filePath);
        const mimetype = (0, file_type_1.fromFile)(filePath);
        const { size } = fs_1.default.statSync(filePath);
        const name = path_1.default.basename(filePath);
        return {
            data,
            mimetype: (await mimetype).mime,
            name,
            size,
        };
    }
    return undefined;
};
exports.default = getFileByPath;
//# sourceMappingURL=getFileByPath.js.map