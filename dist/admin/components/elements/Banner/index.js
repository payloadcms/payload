"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
require("./index.scss");
const baseClass = 'banner';
const Banner = ({ children, className, to, icon, alignIcon = 'right', onClick, type = 'default', }) => {
    const classes = [
        baseClass,
        `${baseClass}--type-${type}`,
        className && className,
        to && `${baseClass}--has-link`,
        (to || onClick) && `${baseClass}--has-action`,
        icon && `${baseClass}--has-icon`,
        icon && `${baseClass}--align-icon-${alignIcon}`,
    ].filter(Boolean).join(' ');
    let RenderedType = 'div';
    if (onClick && !to)
        RenderedType = 'button';
    if (to)
        RenderedType = react_router_dom_1.Link;
    return (react_1.default.createElement(RenderedType, { className: classes, onClick: onClick, to: to || undefined },
        (icon && alignIcon === 'left') && (react_1.default.createElement(react_1.default.Fragment, null, icon)),
        react_1.default.createElement("span", { className: `${baseClass}__content` }, children),
        (icon && alignIcon === 'right') && (react_1.default.createElement(react_1.default.Fragment, null, icon))));
};
exports.Banner = Banner;
exports.default = exports.Banner;
//# sourceMappingURL=index.js.map