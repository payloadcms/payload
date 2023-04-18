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
exports.Drawer = exports.DrawerToggler = exports.formatDrawerSlug = void 0;
const react_1 = __importStar(require("react"));
const modal_1 = require("@faceless-ui/modal");
const window_info_1 = require("@faceless-ui/window-info");
const react_i18next_1 = require("react-i18next");
const EditDepth_1 = require("../../utilities/EditDepth");
const Gutter_1 = require("../Gutter");
require("./index.scss");
const X_1 = __importDefault(require("../../icons/X"));
const baseClass = 'drawer';
const zBase = 100;
const formatDrawerSlug = ({ slug, depth, }) => `drawer_${depth}_${slug}`;
exports.formatDrawerSlug = formatDrawerSlug;
const DrawerToggler = ({ slug, children, className, onClick, disabled, ...rest }) => {
    const { openModal } = (0, modal_1.useModal)();
    const handleClick = (0, react_1.useCallback)((e) => {
        openModal(slug);
        if (typeof onClick === 'function')
            onClick(e);
    }, [openModal, slug, onClick]);
    return (react_1.default.createElement("button", { onClick: handleClick, type: "button", className: className, disabled: disabled, ...rest }, children));
};
exports.DrawerToggler = DrawerToggler;
const Drawer = ({ slug, children, className, header, title, gutter = true, }) => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const { closeModal, modalState } = (0, modal_1.useModal)();
    const { breakpoints: { m: midBreak } } = (0, window_info_1.useWindowInfo)();
    const drawerDepth = (0, EditDepth_1.useEditDepth)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [animateIn, setAnimateIn] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        var _a;
        setIsOpen((_a = modalState[slug]) === null || _a === void 0 ? void 0 : _a.isOpen);
    }, [slug, modalState]);
    (0, react_1.useEffect)(() => {
        setAnimateIn(isOpen);
    }, [isOpen]);
    if (isOpen) {
        // IMPORTANT: do not render the drawer until it is explicitly open, this is to avoid large html trees especially when nesting drawers
        return (react_1.default.createElement(modal_1.Modal, { slug: slug, className: [
                className,
                baseClass,
                animateIn && `${baseClass}--is-open`,
            ].filter(Boolean).join(' '), style: {
                zIndex: zBase + drawerDepth,
            } },
            drawerDepth === 1 && (react_1.default.createElement("div", { className: `${baseClass}__blur-bg` })),
            react_1.default.createElement("button", { className: `${baseClass}__close`, id: `close-drawer__${slug}`, type: "button", onClick: () => closeModal(slug), style: {
                    width: `calc(${midBreak ? 'var(--gutter-h)' : 'var(--nav-width)'} + ${drawerDepth - 1} * 25px)`,
                }, "aria-label": t('close') }),
            react_1.default.createElement("div", { className: `${baseClass}__content` },
                react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__content-children`, right: gutter, left: gutter },
                    react_1.default.createElement(EditDepth_1.EditDepthContext.Provider, { value: drawerDepth + 1 },
                        header && header,
                        header === undefined && (react_1.default.createElement("div", { className: `${baseClass}__header` },
                            react_1.default.createElement("h2", { className: `${baseClass}__header__title` }, title),
                            react_1.default.createElement("button", { className: `${baseClass}__header__close`, id: `close-drawer__${slug}`, type: "button", onClick: () => closeModal(slug), "aria-label": t('close') },
                                react_1.default.createElement(X_1.default, null)))),
                        children)))));
    }
    return null;
};
exports.Drawer = Drawer;
//# sourceMappingURL=index.js.map