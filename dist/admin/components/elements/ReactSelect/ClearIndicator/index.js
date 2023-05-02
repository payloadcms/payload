"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearIndicator = void 0;
const react_1 = __importDefault(require("react"));
const X_1 = __importDefault(require("../../../icons/X"));
require("./index.scss");
const baseClass = 'clear-indicator';
const ClearIndicator = (props) => {
    const { innerProps: { ref, ...restInnerProps }, } = props;
    return (react_1.default.createElement("div", { className: baseClass, ref: ref, ...restInnerProps },
        react_1.default.createElement(X_1.default, { className: `${baseClass}__icon` })));
};
exports.ClearIndicator = ClearIndicator;
//# sourceMappingURL=index.js.map