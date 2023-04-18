"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const DatePicker_1 = __importDefault(require("../../../DatePicker"));
const baseClass = 'condition-value-date';
const DateField = ({ onChange, value }) => (react_1.default.createElement("div", { className: baseClass },
    react_1.default.createElement(DatePicker_1.default, { onChange: onChange, value: value })));
exports.default = DateField;
//# sourceMappingURL=index.js.map