"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const baseClass = 'popup-button';
const PopupButton = (props) => {
    const { className, buttonType, button, setActive, active, } = props;
    const classes = [
        baseClass,
        className,
        `${baseClass}--${buttonType}`,
    ].filter(Boolean).join(' ');
    const handleClick = () => {
        setActive(!active);
    };
    if (buttonType === 'none') {
        return null;
    }
    if (buttonType === 'custom') {
        return (react_1.default.createElement("div", { role: "button", tabIndex: 0, onKeyDown: (e) => { if (e.key === 'Enter')
                handleClick(); }, onClick: handleClick, className: classes }, button));
    }
    return (react_1.default.createElement("button", { type: "button", onClick: () => setActive(!active), className: classes }, button));
};
exports.default = PopupButton;
//# sourceMappingURL=index.js.map