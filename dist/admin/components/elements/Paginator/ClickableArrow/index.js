"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Chevron_1 = __importDefault(require("../../../icons/Chevron"));
require("./index.scss");
const baseClass = 'clickable-arrow';
const ClickableArrow = (props) => {
    const { updatePage, isDisabled = false, direction = 'right', } = props;
    const classes = [
        baseClass,
        isDisabled && `${baseClass}--is-disabled`,
        direction && `${baseClass}--${direction}`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("button", { className: classes, onClick: !isDisabled ? updatePage : undefined, type: "button" },
        react_1.default.createElement(Chevron_1.default, null)));
};
exports.default = ClickableArrow;
//# sourceMappingURL=index.js.map