"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTranslations = void 0;
const index_1 = __importDefault(require("./index"));
const extractTranslations = (keys) => {
    const result = {};
    keys.forEach((key) => {
        result[key] = {};
    });
    Object.entries(index_1.default).forEach(([language, resource]) => {
        keys.forEach((key) => {
            const [section, target] = key.split(':');
            result[key][language] = resource[section][target];
        });
    });
    return result;
};
exports.extractTranslations = extractTranslations;
//# sourceMappingURL=extractTranslations.js.map