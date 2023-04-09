"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiValueLabel = void 0;
const react_1 = __importDefault(require("react"));
const react_select_1 = require("react-select");
require("./index.scss");
const baseClass = 'multi-value-label';
const MultiValueLabel = (props) => {
    const { selectProps: { draggableProps, }, } = props;
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(react_select_1.components.MultiValueLabel, { ...props, innerProps: {
                className: `${baseClass}__text`,
                ...draggableProps || {},
            } })));
};
exports.MultiValueLabel = MultiValueLabel;
//# sourceMappingURL=index.js.map