"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ListButton_1 = __importDefault(require("../ListButton"));
const OrderedList_1 = __importDefault(require("../../../../../icons/OrderedList"));
require("./index.scss");
const OL = ({ attributes, children }) => (react_1.default.createElement("ol", { className: "rich-text-ol", ...attributes }, children));
const ol = {
    Button: () => (react_1.default.createElement(ListButton_1.default, { format: "ol" },
        react_1.default.createElement(OrderedList_1.default, null))),
    Element: OL,
};
exports.default = ol;
//# sourceMappingURL=index.js.map