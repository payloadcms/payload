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
const react_i18next_1 = require("react-i18next");
const Copy_1 = __importDefault(require("../../icons/Copy"));
const Tooltip_1 = __importDefault(require("../Tooltip"));
require("./index.scss");
const baseClass = 'copy-to-clipboard';
const CopyToClipboard = ({ value, defaultMessage, successMessage, }) => {
    const ref = (0, react_1.useRef)(null);
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const { t } = (0, react_i18next_1.useTranslation)('general');
    if (value) {
        return (react_1.default.createElement("button", { onMouseEnter: () => {
                setHovered(true);
                setCopied(false);
            }, onMouseLeave: () => {
                setHovered(false);
                setCopied(false);
            }, type: "button", className: baseClass, onClick: () => {
                if (ref && ref.current) {
                    ref.current.select();
                    ref.current.setSelectionRange(0, value.length + 1);
                    document.execCommand('copy');
                    setCopied(true);
                }
            } },
            react_1.default.createElement(Copy_1.default, null),
            react_1.default.createElement(Tooltip_1.default, { show: hovered || copied, delay: copied ? 0 : undefined },
                copied && (successMessage !== null && successMessage !== void 0 ? successMessage : t('copied')),
                !copied && (defaultMessage !== null && defaultMessage !== void 0 ? defaultMessage : t('copy'))),
            react_1.default.createElement("textarea", { readOnly: true, value: value, ref: ref })));
    }
    return null;
};
exports.default = CopyToClipboard;
//# sourceMappingURL=index.js.map