"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const baseClass = 'id-label';
const IDLabel = ({ id, prefix = 'ID:' }) => (react_1.default.createElement("div", { className: baseClass },
    prefix,
    "\u00A0\u00A0",
    id));
exports.default = IDLabel;
//# sourceMappingURL=index.js.map