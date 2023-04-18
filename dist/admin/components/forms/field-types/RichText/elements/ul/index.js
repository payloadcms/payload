"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const UnorderedList_1 = __importDefault(require("../../../../../icons/UnorderedList"));
const ListButton_1 = __importDefault(require("../ListButton"));
require("./index.scss");
const UL = ({ attributes, children }) => (react_1.default.createElement("ul", { className: "rich-text-ul", ...attributes }, children));
const ul = {
    Button: () => (react_1.default.createElement(ListButton_1.default, { format: "ul" },
        react_1.default.createElement(UnorderedList_1.default, null))),
    Element: UL,
};
exports.default = ul;
//# sourceMappingURL=index.js.map