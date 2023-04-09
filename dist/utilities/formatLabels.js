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
exports.toWords = exports.formatLabels = exports.formatNames = void 0;
const pluralize_1 = __importStar(require("pluralize"));
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
const toWords = (inputString, joinWords = false) => {
    const notNullString = inputString || '';
    const trimmedString = notNullString.trim();
    const arrayOfStrings = trimmedString.split(/[\s-]/);
    const splitStringsArray = [];
    arrayOfStrings.forEach((tempString) => {
        if (tempString !== '') {
            const splitWords = tempString.split(/(?=[A-Z])/).join(' ');
            splitStringsArray.push(capitalizeFirstLetter(splitWords));
        }
    });
    return joinWords
        ? splitStringsArray.join('').replace(/\s/gi, '')
        : splitStringsArray.join(' ');
};
exports.toWords = toWords;
const formatLabels = ((slug) => {
    const words = toWords(slug);
    return ((0, pluralize_1.isPlural)(slug))
        ? {
            singular: (0, pluralize_1.singular)(words),
            plural: words,
        }
        : {
            singular: words,
            plural: (0, pluralize_1.default)(words),
        };
});
exports.formatLabels = formatLabels;
const formatNames = ((slug) => {
    const words = toWords(slug, true);
    return ((0, pluralize_1.isPlural)(slug))
        ? {
            singular: (0, pluralize_1.singular)(words),
            plural: words,
        }
        : {
            singular: words,
            plural: (0, pluralize_1.default)(words),
        };
});
exports.formatNames = formatNames;
//# sourceMappingURL=formatLabels.js.map