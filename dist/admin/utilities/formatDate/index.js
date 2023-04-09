"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
const date_fns_1 = require("date-fns");
const Locale = __importStar(require("date-fns/locale"));
const getSupportedDateLocale_1 = require("./getSupportedDateLocale");
const formatDate = (date, pattern, locale) => {
    const theDate = new Date(date);
    const currentLocale = Locale[(0, getSupportedDateLocale_1.getSupportedDateLocale)(locale)];
    return (0, date_fns_1.format)(theDate, pattern, { locale: currentLocale });
};
exports.formatDate = formatDate;
//# sourceMappingURL=index.js.map