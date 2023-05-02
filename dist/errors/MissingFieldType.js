"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../fields/config/types");
const APIError_1 = __importDefault(require("./APIError"));
class MissingFieldType extends APIError_1.default {
    constructor(field) {
        super(`Field${(0, types_1.fieldAffectsData)(field) ? ` "${field.name}"` : ''} is either missing a field type or it does not match an available field type`);
    }
}
exports.default = MissingFieldType;
//# sourceMappingURL=MissingFieldType.js.map