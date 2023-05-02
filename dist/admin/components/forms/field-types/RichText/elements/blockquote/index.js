"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Blockquote_1 = __importDefault(require("../../../../../icons/Blockquote"));
require("./index.scss");
const Blockquote = ({ attributes, children }) => (react_1.default.createElement("blockquote", { className: "rich-text-blockquote", ...attributes }, children));
const blockquote = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "blockquote" },
        react_1.default.createElement(Blockquote_1.default, null))),
    Element: Blockquote,
};
exports.default = blockquote;
//# sourceMappingURL=index.js.map