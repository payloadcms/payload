"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const listTypes_1 = __importDefault(require("../listTypes"));
const LI = (props) => {
    var _a, _b;
    const { attributes, element, children } = props;
    const disableListStyle = element.children.length >= 1 && listTypes_1.default.includes((_b = (_a = element.children) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type);
    return (react_1.default.createElement("li", { style: { listStyle: disableListStyle ? 'none' : undefined }, ...attributes }, children));
};
exports.default = {
    Element: LI,
};
//# sourceMappingURL=index.js.map