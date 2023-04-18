"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Code_1 = __importDefault(require("../../../../../icons/Code"));
const Code = ({ attributes, children }) => (react_1.default.createElement("code", { ...attributes }, children));
const code = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "code" },
        react_1.default.createElement(Code_1.default, null))),
    Leaf: Code,
};
exports.default = code;
//# sourceMappingURL=index.js.map