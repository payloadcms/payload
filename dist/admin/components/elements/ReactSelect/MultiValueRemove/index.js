"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiValueRemove = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const X_1 = __importDefault(require("../../../icons/X"));
const Tooltip_1 = __importDefault(require("../../Tooltip"));
require("./index.scss");
const baseClass = 'multi-value-remove';
const MultiValueRemove = (props) => {
    const { innerProps, } = props;
    const [showTooltip, setShowTooltip] = react_1.default.useState(false);
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement("button", { ...innerProps, type: "button", className: baseClass, onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false), onClick: (e) => {
            setShowTooltip(false);
            innerProps.onClick(e);
        }, "aria-label": t('remove') },
        react_1.default.createElement(Tooltip_1.default, { className: `${baseClass}__tooltip`, show: showTooltip }, t('remove')),
        react_1.default.createElement(X_1.default, { className: `${baseClass}__icon` })));
};
exports.MultiValueRemove = MultiValueRemove;
//# sourceMappingURL=index.js.map