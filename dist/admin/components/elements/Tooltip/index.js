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
const useIntersect_1 = __importDefault(require("../../../hooks/useIntersect"));
require("./index.scss");
const Tooltip = (props) => {
    const { className, children, show: showFromProps = true, delay = 350, boundingRef, } = props;
    const [show, setShow] = react_1.default.useState(showFromProps);
    const [position, setPosition] = react_1.default.useState('top');
    const [ref, intersectionEntry] = (0, useIntersect_1.default)({
        threshold: 0,
        rootMargin: '-145px 0px 0px 100px',
        root: (boundingRef === null || boundingRef === void 0 ? void 0 : boundingRef.current) || null,
    });
    (0, react_1.useEffect)(() => {
        let timerId;
        // do not use the delay on transition-out
        if (delay && showFromProps) {
            timerId = setTimeout(() => {
                setShow(showFromProps);
            }, delay);
        }
        else {
            setShow(showFromProps);
        }
        return () => {
            if (timerId)
                clearTimeout(timerId);
        };
    }, [showFromProps, delay]);
    (0, react_1.useEffect)(() => {
        setPosition((intersectionEntry === null || intersectionEntry === void 0 ? void 0 : intersectionEntry.isIntersecting) ? 'top' : 'bottom');
    }, [intersectionEntry]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("aside", { ref: ref, className: [
                'tooltip',
                className,
                'tooltip--position-top',
            ].filter(Boolean).join(' '), "aria-hidden": "true" }, children),
        react_1.default.createElement("aside", { className: [
                'tooltip',
                className,
                show && 'tooltip--show',
                `tooltip--position-${position}`,
            ].filter(Boolean).join(' ') }, children)));
};
exports.default = Tooltip;
//# sourceMappingURL=index.js.map