"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const SelectionProvider_1 = require("../SelectionProvider");
const Check_1 = __importDefault(require("../../../../icons/Check"));
const Line_1 = __importDefault(require("../../../../icons/Line"));
require("./index.scss");
const baseClass = 'select-all';
const SelectAll = () => {
    const { selectAll, toggleAll } = (0, SelectionProvider_1.useSelection)();
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("button", { type: "button", onClick: () => toggleAll() },
            react_1.default.createElement("span", { className: `${baseClass}__input` },
                (selectAll === SelectionProvider_1.SelectAllStatus.AllInPage || selectAll === SelectionProvider_1.SelectAllStatus.AllAvailable) && (react_1.default.createElement(Check_1.default, null)),
                selectAll === SelectionProvider_1.SelectAllStatus.Some && (react_1.default.createElement(Line_1.default, null))))));
};
exports.default = SelectAll;
//# sourceMappingURL=index.js.map