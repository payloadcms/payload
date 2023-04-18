"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const useDraggableSortable_1 = require("../DraggableSortable/useDraggableSortable");
require("./index.scss");
const baseClass = 'pill';
const DraggablePill = (props) => {
    const { className, id } = props;
    const { attributes, listeners, transform, setNodeRef, isDragging } = (0, useDraggableSortable_1.useDraggableSortable)({
        id,
    });
    return (react_1.default.createElement(StaticPill, { ...props, className: [
            isDragging && `${baseClass}--is-dragging`,
            className,
        ].filter(Boolean).join(' '), elementProps: {
            ...listeners,
            ...attributes,
            style: {
                transform,
            },
            ref: setNodeRef,
        } }));
};
const StaticPill = (props) => {
    const { className, to, icon, alignIcon = 'right', onClick, pillStyle = 'light', draggable, children, elementProps, } = props;
    const classes = [
        baseClass,
        `${baseClass}--style-${pillStyle}`,
        className && className,
        to && `${baseClass}--has-link`,
        (to || onClick) && `${baseClass}--has-action`,
        icon && `${baseClass}--has-icon`,
        icon && `${baseClass}--align-icon-${alignIcon}`,
        draggable && `${baseClass}--draggable`,
    ].filter(Boolean).join(' ');
    let Element = 'div';
    if (onClick && !to)
        Element = 'button';
    if (to)
        Element = react_router_dom_1.Link;
    return (react_1.default.createElement(Element, { ...elementProps, className: classes, type: Element === 'button' ? 'button' : undefined, to: to || undefined, onClick: onClick },
        (icon && alignIcon === 'left') && (react_1.default.createElement(react_1.default.Fragment, null, icon)),
        children,
        (icon && alignIcon === 'right') && (react_1.default.createElement(react_1.default.Fragment, null, icon))));
};
const Pill = (props) => {
    const { draggable } = props;
    if (draggable)
        return react_1.default.createElement(DraggablePill, { ...props });
    return react_1.default.createElement(StaticPill, { ...props });
};
exports.default = Pill;
//# sourceMappingURL=index.js.map