"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Thumbnail_1 = __importDefault(require("../../../../../../elements/Thumbnail"));
require("./index.scss");
const baseClass = 'file';
const File = ({ rowData, data, collection }) => {
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Thumbnail_1.default, { size: "small", className: `${baseClass}__thumbnail`, doc: {
                ...rowData,
                filename: data,
            }, collection: collection }),
        react_1.default.createElement("span", { className: `${baseClass}__filename` }, String(data))));
};
exports.default = File;
//# sourceMappingURL=index.js.map