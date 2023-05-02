"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Bold_1 = __importDefault(require("../../../../../icons/Bold"));
const Bold = ({ attributes, children }) => (react_1.default.createElement("strong", { ...attributes }, children));
const bold = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "bold" },
        react_1.default.createElement(Bold_1.default, null))),
    Leaf: Bold,
};
exports.default = bold;
//# sourceMappingURL=index.js.map