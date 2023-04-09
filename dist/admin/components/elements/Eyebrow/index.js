"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const StepNav_1 = __importDefault(require("../StepNav"));
const Gutter_1 = require("../Gutter");
require("./index.scss");
const baseClass = 'eyebrow';
const Eyebrow = ({ actions }) => (react_1.default.createElement("div", { className: baseClass },
    react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
        react_1.default.createElement(StepNav_1.default, null),
        actions)));
exports.default = Eyebrow;
//# sourceMappingURL=index.js.map