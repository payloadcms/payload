"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class MissingFieldInputOptions extends APIError_1.default {
    constructor(field) {
        super(`Field ${field.label} is missing options.`);
    }
}
exports.default = MissingFieldInputOptions;
//# sourceMappingURL=MissingFieldInputOptions.js.map