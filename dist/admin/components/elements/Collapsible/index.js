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
exports.Collapsible = void 0;
const react_1 = __importStar(require("react"));
const react_animate_height_1 = __importDefault(require("react-animate-height"));
const react_i18next_1 = require("react-i18next");
const provider_1 = require("./provider");
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
const Drag_1 = __importDefault(require("../../icons/Drag"));
require("./index.scss");
const baseClass = 'collapsible';
const Collapsible = ({ children, collapsed: collapsedFromProps, onToggle, className, header, initCollapsed, dragHandleProps, actions, }) => {
    const [collapsedLocal, setCollapsedLocal] = (0, react_1.useState)(Boolean(initCollapsed));
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const isNested = (0, provider_1.useCollapsible)();
    const { t } = (0, react_i18next_1.useTranslation)('fields');
    const collapsed = typeof collapsedFromProps === 'boolean' ? collapsedFromProps : collapsedLocal;
    return (react_1.default.createElement("div", { className: [
            baseClass,
            className,
            dragHandleProps && `${baseClass}--has-drag-handle`,
            collapsed && `${baseClass}--collapsed`,
            isNested && `${baseClass}--nested`,
            hovered && `${baseClass}--hovered`,
        ].filter(Boolean).join(' ') },
        react_1.default.createElement(provider_1.CollapsibleProvider, null,
            react_1.default.createElement("div", { className: `${baseClass}__toggle-wrap`, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) },
                dragHandleProps && (react_1.default.createElement("div", { className: `${baseClass}__drag`, ...dragHandleProps.attributes, ...dragHandleProps.listeners },
                    react_1.default.createElement(Drag_1.default, null))),
                react_1.default.createElement("button", { type: "button", className: [
                        `${baseClass}__toggle`,
                        `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
                    ].filter(Boolean).join(' '), onClick: () => {
                        if (typeof onToggle === 'function')
                            onToggle(!collapsed);
                        setCollapsedLocal(!collapsed);
                    } },
                    react_1.default.createElement("span", null, t('toggleBlock'))),
                header && (react_1.default.createElement("div", { className: [
                        `${baseClass}__header-wrap`,
                        dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`,
                    ].filter(Boolean).join(' ') }, header && header)),
                react_1.default.createElement("div", { className: `${baseClass}__actions-wrap` },
                    actions && (react_1.default.createElement("div", { className: `${baseClass}__actions` }, actions)),
                    react_1.default.createElement(Chevron_1.default, { className: `${baseClass}__indicator` }))),
            react_1.default.createElement(react_animate_height_1.default, { height: collapsed ? 0 : 'auto', duration: 200 },
                react_1.default.createElement("div", { className: `${baseClass}__content` }, children)))));
};
exports.Collapsible = Collapsible;
//# sourceMappingURL=index.js.map