"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const context_1 = require("../Form/context");
const Button_1 = __importDefault(require("../../elements/Button"));
require("./index.scss");
const baseClass = 'form-submit';
const FormSubmit = (props) => {
    const { children, buttonId: id, disabled: disabledFromProps, type = 'submit' } = props;
    const processing = (0, context_1.useFormProcessing)();
    const { disabled } = (0, context_1.useForm)();
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Button_1.default, { ...props, id: id, type: type, disabled: disabledFromProps || processing || disabled ? true : undefined }, children)));
};
exports.default = FormSubmit;
//# sourceMappingURL=index.js.map