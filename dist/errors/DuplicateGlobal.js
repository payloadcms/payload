"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class DuplicateGlobal extends APIError_1.default {
    constructor(config) {
        super(`Global label "${config.label}" is already in use`);
    }
}
exports.default = DuplicateGlobal;
//# sourceMappingURL=DuplicateGlobal.js.map