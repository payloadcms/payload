"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ThumbnailCard_1 = require("../ThumbnailCard");
require("./index.scss");
const baseClass = 'upload-gallery';
const UploadGallery = (props) => {
    const { docs, onCardClick, collection } = props;
    if (docs && docs.length > 0) {
        return (react_1.default.createElement("ul", { className: baseClass }, docs.map((doc) => (react_1.default.createElement("li", { key: String(doc.id) },
            react_1.default.createElement(ThumbnailCard_1.ThumbnailCard, { doc: doc, collection: collection, onClick: () => onCardClick(doc) }))))));
    }
    return null;
};
exports.default = UploadGallery;
//# sourceMappingURL=index.js.map