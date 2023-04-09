"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowLabel = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const types_1 = require("./types");
const context_1 = require("../Form/context");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const baseClass = 'row-label';
const RowLabel = ({ className, ...rest }) => {
    return (react_1.default.createElement("span", { style: {
            pointerEvents: 'none',
        }, className: [
            baseClass,
            className,
        ].filter(Boolean).join(' ') },
        react_1.default.createElement(RowLabelContent, { ...rest })));
};
exports.RowLabel = RowLabel;
const RowLabelContent = (props) => {
    const { path, label, rowNumber, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { getDataByPath, getSiblingData } = (0, context_1.useWatchForm)();
    const collapsibleData = getSiblingData(path);
    const arrayData = getDataByPath(path);
    const data = arrayData || collapsibleData;
    if ((0, types_1.isComponent)(label)) {
        const Label = label;
        return (react_1.default.createElement(Label, { data: data, path: path, index: rowNumber }));
    }
    return (react_1.default.createElement(react_1.default.Fragment, null, typeof label === 'function' ? label({
        data,
        path,
        index: rowNumber,
    }) : (0, getTranslation_1.getTranslation)(label, i18n)));
};
//# sourceMappingURL=index.js.map