"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const SelectionProvider_1 = require("../../views/collections/List/SelectionProvider");
require("./index.scss");
const baseClass = 'list-selection';
const ListSelection = ({ label }) => {
    const { toggleAll, count, totalDocs, selectAll } = (0, SelectionProvider_1.useSelection)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    if (count === 0) {
        return null;
    }
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("span", null, t('selectedCount', { label, count })),
        selectAll !== SelectionProvider_1.SelectAllStatus.AllAvailable && (react_1.default.createElement(react_1.Fragment, null,
            ' ',
            "\u2014",
            react_1.default.createElement("button", { className: `${baseClass}__button`, type: "button", onClick: () => toggleAll(true), "aria-label": t('selectAll', { label, count }) }, t('selectAll', { label, count: totalDocs }))))));
};
exports.default = ListSelection;
//# sourceMappingURL=index.js.map