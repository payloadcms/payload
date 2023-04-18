"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = __importDefault(require("./plugin"));
const Element_1 = __importDefault(require("./Element"));
const Button_1 = __importDefault(require("./Button"));
exports.default = {
    Button: Button_1.default,
    Element: Element_1.default,
    plugins: [
        plugin_1.default,
    ],
};
//# sourceMappingURL=index.js.map