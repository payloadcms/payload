"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const SelectionProvider_1 = require("../SelectionProvider");
const Check_1 = __importDefault(require("../../../../icons/Check"));
require("./index.scss");
const baseClass = 'select-row';
const SelectRow = ({ id }) => {
    const { selected, setSelection } = (0, SelectionProvider_1.useSelection)();
    return (react_1.default.createElement("div", { className: [
            baseClass,
            (selected[id]) && `${baseClass}--checked`,
        ].filter(Boolean).join(' '), key: id },
        react_1.default.createElement("button", { type: "button", onClick: () => setSelection(id) },
            react_1.default.createElement("span", { className: `${baseClass}__input` },
                react_1.default.createElement(Check_1.default, null)))));
};
exports.default = SelectRow;
//# sourceMappingURL=index.js.map