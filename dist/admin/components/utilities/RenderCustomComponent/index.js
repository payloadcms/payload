"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const RenderCustomComponent = (props) => {
    const { CustomComponent, DefaultComponent, componentProps } = props;
    if (CustomComponent) {
        return (react_1.default.createElement(CustomComponent, { ...componentProps }));
    }
    return (react_1.default.createElement(DefaultComponent, { ...componentProps }));
};
exports.default = RenderCustomComponent;
//# sourceMappingURL=index.js.map