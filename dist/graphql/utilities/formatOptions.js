"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../fields/config/types");
const formatName_1 = __importDefault(require("./formatName"));
const formatOptions = (field) => {
    return field.options.reduce((values, option) => {
        if ((0, types_1.optionIsObject)(option)) {
            return {
                ...values,
                [(0, formatName_1.default)(option.value)]: {
                    value: option.value,
                },
            };
        }
        return {
            ...values,
            [(0, formatName_1.default)(option)]: {
                value: option,
            },
        };
    }, {});
};
exports.default = formatOptions;
//# sourceMappingURL=formatOptions.js.map