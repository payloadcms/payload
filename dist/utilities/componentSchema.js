"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.componentSchema = joi_1.default.alternatives().try(joi_1.default.object().unknown(), joi_1.default.func());
//# sourceMappingURL=componentSchema.js.map