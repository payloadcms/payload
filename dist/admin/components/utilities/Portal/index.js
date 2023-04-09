"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_dom_1 = __importDefault(require("react-dom"));
const Portal = ({ children }) => react_dom_1.default.createPortal(children, document.getElementById('portal'));
exports.default = Portal;
//# sourceMappingURL=index.js.map