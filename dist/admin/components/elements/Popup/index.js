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
const window_info_1 = require("@faceless-ui/window-info");
const PopupButton_1 = __importDefault(require("./PopupButton"));
const useIntersect_1 = __importDefault(require("../../../hooks/useIntersect"));
require("./index.scss");
const baseClass = 'popup';
const Popup = (props) => {
    const { className, buttonClassName, render, size = 'small', color = 'light', button, buttonType = 'default', children, showOnHover = false, horizontalAlign: horizontalAlignFromProps = 'left', verticalAlign: verticalAlignFromProps = 'top', initActive = false, onToggleOpen, padding, forceOpen, boundingRef, } = props;
    const { width: windowWidth, height: windowHeight } = (0, window_info_1.useWindowInfo)();
    const [intersectionRef, intersectionEntry] = (0, useIntersect_1.default)({
        threshold: 1,
        rootMargin: '-100px 0px 0px 0px',
        root: (boundingRef === null || boundingRef === void 0 ? void 0 : boundingRef.current) || null,
    });
    const buttonRef = (0, react_1.useRef)(null);
    const contentRef = (0, react_1.useRef)(null);
    const [active, setActive] = (0, react_1.useState)(initActive);
    const [verticalAlign, setVerticalAlign] = (0, react_1.useState)(verticalAlignFromProps);
    const [horizontalAlign, setHorizontalAlign] = (0, react_1.useState)(horizontalAlignFromProps);
    const setPosition = (0, react_1.useCallback)(({ horizontal = false, vertical = false }) => {
        if (contentRef.current) {
            const bounds = contentRef.current.getBoundingClientRect();
            const { left: contentLeftPos, right: contentRightPos, top: contentTopPos, bottom: contentBottomPos, } = bounds;
            let boundingTopPos = 100;
            let boundingRightPos = window.innerWidth;
            let boundingBottomPos = window.innerHeight;
            let boundingLeftPos = 0;
            if (boundingRef === null || boundingRef === void 0 ? void 0 : boundingRef.current) {
                ({
                    top: boundingTopPos,
                    right: boundingRightPos,
                    bottom: boundingBottomPos,
                    left: boundingLeftPos,
                } = boundingRef.current.getBoundingClientRect());
            }
            if (horizontal) {
                if (contentRightPos > boundingRightPos && contentLeftPos > boundingLeftPos) {
                    setHorizontalAlign('right');
                }
                else if (contentLeftPos < boundingLeftPos && contentRightPos < boundingRightPos) {
                    setHorizontalAlign('left');
                }
            }
            if (vertical) {
                if (contentTopPos < boundingTopPos && contentBottomPos < boundingBottomPos) {
                    setVerticalAlign('bottom');
                }
                else if (contentBottomPos > boundingBottomPos && contentTopPos > boundingTopPos) {
                    setVerticalAlign('top');
                }
            }
        }
    }, [boundingRef]);
    const handleClickOutside = (0, react_1.useCallback)((e) => {
        if (contentRef.current.contains(e.target)) {
            return;
        }
        setActive(false);
    }, [contentRef]);
    (0, react_1.useEffect)(() => {
        setPosition({ horizontal: true });
    }, [intersectionEntry, setPosition, windowWidth]);
    (0, react_1.useEffect)(() => {
        setPosition({ vertical: true });
    }, [intersectionEntry, setPosition, windowHeight]);
    (0, react_1.useEffect)(() => {
        if (typeof onToggleOpen === 'function')
            onToggleOpen(active);
        if (active) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [active, handleClickOutside, onToggleOpen]);
    (0, react_1.useEffect)(() => {
        setActive(forceOpen);
    }, [forceOpen]);
    const classes = [
        baseClass,
        className,
        `${baseClass}--size-${size}`,
        `${baseClass}--color-${color}`,
        `${baseClass}--v-align-${verticalAlign}`,
        `${baseClass}--h-align-${horizontalAlign}`,
        (active) && `${baseClass}--active`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes },
        react_1.default.createElement("div", { ref: buttonRef, className: `${baseClass}__wrapper` }, showOnHover
            ? (react_1.default.createElement("div", { className: `${baseClass}__on-hover-watch`, onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false) },
                react_1.default.createElement(PopupButton_1.default, { ...{ className: buttonClassName, buttonType, button, setActive, active } })))
            : (react_1.default.createElement(PopupButton_1.default, { ...{ className: buttonClassName, buttonType, button, setActive, active } }))),
        react_1.default.createElement("div", { className: `${baseClass}__content`, ref: contentRef },
            react_1.default.createElement("div", { className: `${baseClass}__wrap`, ref: intersectionRef },
                react_1.default.createElement("div", { className: `${baseClass}__scroll`, style: {
                        padding,
                    } },
                    render && render({ close: () => setActive(false) }),
                    children && children)))));
};
exports.default = Popup;
//# sourceMappingURL=index.js.map