"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = __importDefault(require("@monaco-editor/react"));
const Theme_1 = require("../../utilities/Theme");
require("./index.scss");
const ShimmerEffect_1 = require("../ShimmerEffect");
const baseClass = 'code-editor';
const CodeEditor = (props) => {
    const { readOnly, className, options, height, ...rest } = props;
    const { theme } = (0, Theme_1.useTheme)();
    const classes = [
        baseClass,
        className,
        (rest === null || rest === void 0 ? void 0 : rest.defaultLanguage) ? `language--${rest.defaultLanguage}` : '',
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement(react_2.default, { className: classes, theme: theme === 'dark' ? 'vs-dark' : 'vs', loading: react_1.default.createElement(ShimmerEffect_1.ShimmerEffect, { height: height }), options: {
            detectIndentation: true,
            minimap: {
                enabled: false,
            },
            readOnly: Boolean(readOnly),
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
            ...options,
        }, height: height, ...rest }));
};
exports.default = CodeEditor;
//# sourceMappingURL=CodeEditor.js.map