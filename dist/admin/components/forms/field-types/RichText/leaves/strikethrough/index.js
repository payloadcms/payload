"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Strikethrough_1 = __importDefault(require("../../../../../icons/Strikethrough"));
const Strikethrough = ({ attributes, children }) => (react_1.default.createElement("del", { ...attributes }, children));
const strikethrough = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "strikethrough" },
        react_1.default.createElement(Strikethrough_1.default, null))),
    Leaf: Strikethrough,
};
exports.default = strikethrough;
//# sourceMappingURL=index.js.map