"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Config_1 = require("../../../utilities/Config");
const CopyToClipboard_1 = __importDefault(require("../../CopyToClipboard"));
const formatFilesize_1 = __importDefault(require("../../../../../uploads/formatFilesize"));
require("./index.scss");
const baseClass = 'file-meta';
const Meta = (props) => {
    const { filename, filesize, width, height, mimeType, staticURL, url, } = props;
    const { serverURL } = (0, Config_1.useConfig)();
    const fileURL = url || `${serverURL}${staticURL}/${filename}`;
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__url` },
            react_1.default.createElement("a", { href: fileURL, target: "_blank", rel: "noopener noreferrer" }, filename),
            react_1.default.createElement(CopyToClipboard_1.default, { value: fileURL, defaultMessage: "Copy URL" })),
        react_1.default.createElement("div", { className: `${baseClass}__size-type` },
            (0, formatFilesize_1.default)(filesize),
            (width && height) && (react_1.default.createElement(react_1.default.Fragment, null,
                "\u00A0-\u00A0",
                width,
                "x",
                height)),
            mimeType && (react_1.default.createElement(react_1.default.Fragment, null,
                "\u00A0-\u00A0",
                mimeType)))));
};
exports.default = Meta;
//# sourceMappingURL=index.js.map