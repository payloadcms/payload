"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isComponent = void 0;
const react_1 = __importDefault(require("react"));
function isComponent(label) {
    return react_1.default.isValidElement(label);
}
exports.isComponent = isComponent;
//# sourceMappingURL=types.js.map