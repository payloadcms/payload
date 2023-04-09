"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H5_1 = __importDefault(require("../../../../../icons/headings/H5"));
const H5 = ({ attributes, children }) => (react_1.default.createElement("h5", { ...attributes }, children));
const h5 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h5" },
        react_1.default.createElement(H5_1.default, null))),
    Element: H5,
};
exports.default = h5;
//# sourceMappingURL=index.js.map