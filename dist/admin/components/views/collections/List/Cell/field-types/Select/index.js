"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const types_1 = require("../../../../../../../../fields/config/types");
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const SelectCell = ({ data, field }) => {
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const findLabel = (items) => items.map((i) => {
        var _a, _b;
        const found = (_b = (_a = field.options
            .filter((f) => f.value === i)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.label;
        return (0, getTranslation_1.getTranslation)(found, i18n);
    }).join(', ');
    let content = '';
    if ((0, types_1.optionsAreObjects)(field.options)) {
        content = Array.isArray(data)
            ? findLabel(data) // hasMany
            : findLabel([data]);
    }
    else {
        content = Array.isArray(data)
            ? data.join(', ') // hasMany
            : data;
    }
    return (react_1.default.createElement("span", null, content));
};
exports.default = SelectCell;
//# sourceMappingURL=index.js.map