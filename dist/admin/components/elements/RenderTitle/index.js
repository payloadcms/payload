"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const useTitle_1 = __importDefault(require("../../../hooks/useTitle"));
const IDLabel_1 = __importDefault(require("../IDLabel"));
const baseClass = 'render-title';
const RenderTitle = (props) => {
    const { collection, title: titleFromProps, data, fallback = '[untitled]', } = props;
    const titleFromForm = (0, useTitle_1.default)(collection);
    let title = titleFromForm;
    if (!title)
        title = data === null || data === void 0 ? void 0 : data.id;
    if (!title)
        title = fallback;
    title = titleFromProps || title;
    const idAsTitle = title === (data === null || data === void 0 ? void 0 : data.id);
    if (idAsTitle) {
        return (react_1.default.createElement(IDLabel_1.default, { id: data === null || data === void 0 ? void 0 : data.id }));
    }
    return (react_1.default.createElement("span", { className: baseClass }, title));
};
exports.default = RenderTitle;
//# sourceMappingURL=index.js.map