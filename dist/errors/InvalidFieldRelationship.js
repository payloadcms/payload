"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class InvalidFieldRelationship extends APIError_1.default {
    constructor(field, relationship) {
        super(`Field ${field.label} has invalid relationship '${relationship}'.`);
    }
}
exports.default = InvalidFieldRelationship;
//# sourceMappingURL=InvalidFieldRelationship.js.map