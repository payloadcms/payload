"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable jsx-a11y/click-events-have-key-events */
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Thumbnail_1 = __importDefault(require("../Thumbnail"));
require("./index.scss");
const baseClass = 'upload-card';
const UploadCard = (props) => {
    const { className, onClick, doc, collection, } = props;
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const classes = [
        baseClass,
        className,
        typeof onClick === 'function' && `${baseClass}--has-on-click`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, onClick: typeof onClick === 'function' ? onClick : undefined },
        react_1.default.createElement(Thumbnail_1.default, { size: "expand", doc: doc, collection: collection }),
        react_1.default.createElement("div", { className: `${baseClass}__filename` }, typeof (doc === null || doc === void 0 ? void 0 : doc.filename) === 'string' ? doc === null || doc === void 0 ? void 0 : doc.filename : `[${t('untitled')}]`)));
};
exports.default = UploadCard;
//# sourceMappingURL=index.js.map