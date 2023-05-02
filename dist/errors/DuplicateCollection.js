"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class DuplicateCollection extends APIError_1.default {
    constructor(propertyName, duplicates) {
        super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`);
    }
}
exports.default = DuplicateCollection;
//# sourceMappingURL=DuplicateCollection.js.map