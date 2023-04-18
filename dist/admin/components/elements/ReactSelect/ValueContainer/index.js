"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueContainer = void 0;
const react_1 = __importDefault(require("react"));
const react_select_1 = require("react-select");
require("./index.scss");
const baseClass = 'value-container';
const ValueContainer = (props) => {
    const { selectProps, } = props;
    return (react_1.default.createElement("div", { ref: selectProps.selectProps.droppableRef, className: baseClass },
        react_1.default.createElement(react_select_1.components.ValueContainer, { ...props })));
};
exports.ValueContainer = ValueContainer;
//# sourceMappingURL=index.js.map