"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOptions = void 0;
const index_1 = __importDefault(require("./index"));
exports.defaultOptions = {
    fallbackLng: 'en',
    debug: false,
    supportedLngs: Object.keys(index_1.default),
    resources: index_1.default,
    interpolation: {
        escapeValue: false,
    },
};
//# sourceMappingURL=defaultOptions.js.map