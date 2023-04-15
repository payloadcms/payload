"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const BlockSelection_1 = __importDefault(require("../BlockSelection"));
require("./index.scss");
const baseClass = 'blocks-container';
const BlocksContainer = (props) => {
    const { blocks, ...remainingProps } = props;
    return (react_1.default.createElement("div", { className: baseClass }, blocks === null || blocks === void 0 ? void 0 : blocks.map((block, index) => (react_1.default.createElement(BlockSelection_1.default, { key: index, block: block, ...remainingProps })))));
};
exports.default = BlocksContainer;
//# sourceMappingURL=index.js.map