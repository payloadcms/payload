"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class InvalidFieldName extends APIError_1.default {
    constructor(field, fieldName) {
        super(`Field ${field.label} has invalid name '${fieldName}'. Field names can not include periods (.) and must be alphanumeric.`);
    }
}
exports.default = InvalidFieldName;
//# sourceMappingURL=InvalidFieldName.js.map