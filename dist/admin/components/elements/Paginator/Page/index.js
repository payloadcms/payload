"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const baseClass = 'paginator__page';
const Page = ({ page = 1, isCurrent, updatePage, isFirstPage = false, isLastPage = false, }) => {
    const classes = [
        baseClass,
        isCurrent && `${baseClass}--is-current`,
        isFirstPage && `${baseClass}--is-first-page`,
        isLastPage && `${baseClass}--is-last-page`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("button", { className: classes, onClick: () => updatePage(page), type: "button" }, page));
};
exports.default = Page;
//# sourceMappingURL=index.js.map