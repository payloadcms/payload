"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const UI = (props) => {
    const { admin: { components: { Field, }, }, } = props;
    if (Field) {
        return react_1.default.createElement(Field, { ...props });
    }
    return null;
};
exports.default = (0, withCondition_1.default)(UI);
//# sourceMappingURL=index.js.map