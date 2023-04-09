"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const stat = (0, util_1.promisify)(fs_1.default.stat);
const fileExists = async (filename) => {
    try {
        await stat(filename);
        return true;
    }
    catch (err) {
        return false;
    }
};
exports.default = fileExists;
//# sourceMappingURL=fileExists.js.map