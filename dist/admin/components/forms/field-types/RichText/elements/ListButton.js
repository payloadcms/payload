"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseClass = void 0;
const react_1 = __importStar(require("react"));
const slate_react_1 = require("slate-react");
const toggleList_1 = __importDefault(require("./toggleList"));
const isListActive_1 = __importDefault(require("./isListActive"));
require("../buttons.scss");
exports.baseClass = 'rich-text__button';
const ListButton = ({ format, children, onClick, className }) => {
    const editor = (0, slate_react_1.useSlate)();
    const defaultOnClick = (0, react_1.useCallback)((event) => {
        event.preventDefault();
        (0, toggleList_1.default)(editor, format);
    }, [editor, format]);
    return (react_1.default.createElement("button", { type: "button", className: [
            exports.baseClass,
            className,
            (0, isListActive_1.default)(editor, format) && `${exports.baseClass}__button--active`,
        ].filter(Boolean).join(' '), onClick: onClick || defaultOnClick }, children));
};
exports.default = ListButton;
//# sourceMappingURL=ListButton.js.map