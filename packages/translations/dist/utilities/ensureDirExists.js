"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectoryExists = void 0;
const fs_1 = __importDefault(require("fs"));
function ensureDirectoryExists(directory) {
    try {
        if (!fs_1.default.existsSync(directory)) {
            fs_1.default.mkdirSync(directory, { recursive: true });
        }
    }
    catch (error) {
        console.error(`Error creating directory '${directory}': ${error.message}`);
    }
}
exports.ensureDirectoryExists = ensureDirectoryExists;
