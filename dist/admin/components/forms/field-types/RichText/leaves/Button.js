"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const slate_react_1 = require("slate-react");
const isActive_1 = __importDefault(require("./isActive"));
const toggle_1 = __importDefault(require("./toggle"));
require("../buttons.scss");
const baseClass = 'rich-text__button';
const LeafButton = ({ format, children }) => {
    const editor = (0, slate_react_1.useSlate)();
    return (react_1.default.createElement("button", { type: "button", className: [
            baseClass,
            (0, isActive_1.default)(editor, format) && `${baseClass}__button--active`,
        ].filter(Boolean).join(' '), onMouseDown: (event) => {
            event.preventDefault();
            (0, toggle_1.default)(editor, format);
        } }, children));
};
exports.default = LeafButton;
//# sourceMappingURL=Button.js.map