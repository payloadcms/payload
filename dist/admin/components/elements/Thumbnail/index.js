"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const File_1 = __importDefault(require("../../graphics/File"));
const useThumbnail_1 = __importDefault(require("../../../hooks/useThumbnail"));
require("./index.scss");
const baseClass = 'thumbnail';
const Thumbnail = (props) => {
    const { doc, doc: { filename, }, collection, size, className = '', } = props;
    const thumbnailSRC = (0, useThumbnail_1.default)(collection, doc);
    const classes = [
        baseClass,
        `${baseClass}--size-${size || 'medium'}`,
        className,
    ].join(' ');
    return (react_1.default.createElement("div", { className: classes },
        thumbnailSRC && (react_1.default.createElement("img", { src: thumbnailSRC, alt: filename })),
        !thumbnailSRC && (react_1.default.createElement(File_1.default, null))));
};
exports.default = Thumbnail;
//# sourceMappingURL=index.js.map