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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const Plus_1 = __importDefault(require("../../icons/Plus"));
const X_1 = __importDefault(require("../../icons/X"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Edit_1 = __importDefault(require("../../icons/Edit"));
const Swap_1 = __importDefault(require("../../icons/Swap"));
const Link_1 = __importDefault(require("../../icons/Link"));
const Tooltip_1 = __importDefault(require("../Tooltip"));
require("./index.scss");
const icons = {
    plus: Plus_1.default,
    x: X_1.default,
    chevron: Chevron_1.default,
    edit: Edit_1.default,
    swap: Swap_1.default,
    link: Link_1.default,
};
const baseClass = 'btn';
const ButtonContents = ({ children, icon, tooltip, showTooltip }) => {
    const BuiltInIcon = icons[icon];
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(Tooltip_1.default, { className: `${baseClass}__tooltip`, show: showTooltip }, tooltip),
        react_1.default.createElement("span", { className: `${baseClass}__content` },
            children && (react_1.default.createElement("span", { className: `${baseClass}__label` }, children)),
            icon && (react_1.default.createElement("span", { className: `${baseClass}__icon` },
                (0, react_1.isValidElement)(icon) && icon,
                BuiltInIcon && react_1.default.createElement(BuiltInIcon, null))))));
};
const Button = (props) => {
    const { className, id, type = 'button', el = 'button', to, url, children, onClick, disabled, icon, iconStyle = 'without-border', buttonStyle = 'primary', round, size = 'medium', iconPosition = 'right', newTab, tooltip, } = props;
    const [showTooltip, setShowTooltip] = react_1.default.useState(false);
    const classes = [
        baseClass,
        className && className,
        buttonStyle && `${baseClass}--style-${buttonStyle}`,
        icon && `${baseClass}--icon`,
        iconStyle && `${baseClass}--icon-style-${iconStyle}`,
        (icon && !children) && `${baseClass}--icon-only`,
        disabled && `${baseClass}--disabled`,
        round && `${baseClass}--round`,
        size && `${baseClass}--size-${size}`,
        iconPosition && `${baseClass}--icon-position-${iconPosition}`,
        tooltip && `${baseClass}--has-tooltip`,
    ].filter(Boolean).join(' ');
    function handleClick(event) {
        setShowTooltip(false);
        if (type !== 'submit' && onClick)
            event.preventDefault();
        if (onClick)
            onClick(event);
    }
    const buttonProps = {
        id,
        type,
        className: classes,
        disabled,
        onMouseEnter: tooltip ? () => setShowTooltip(true) : undefined,
        onMouseLeave: tooltip ? () => setShowTooltip(false) : undefined,
        onClick: !disabled ? handleClick : undefined,
        rel: newTab ? 'noopener noreferrer' : undefined,
        target: newTab ? '_blank' : undefined,
    };
    switch (el) {
        case 'link':
            return (react_1.default.createElement(react_router_dom_1.Link, { ...buttonProps, to: to || url },
                react_1.default.createElement(ButtonContents, { icon: icon, tooltip: tooltip, showTooltip: showTooltip }, children)));
        case 'anchor':
            return (react_1.default.createElement("a", { ...buttonProps, href: url },
                react_1.default.createElement(ButtonContents, { icon: icon, tooltip: tooltip, showTooltip: showTooltip }, children)));
        default:
            const Tag = el; // eslint-disable-line no-case-declarations
            return (react_1.default.createElement(Tag, { type: "submit", ...buttonProps },
                react_1.default.createElement(ButtonContents, { icon: icon, tooltip: tooltip, showTooltip: showTooltip }, children)));
    }
};
exports.default = Button;
//# sourceMappingURL=index.js.map