"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailCard = void 0;
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Thumbnail_1 = __importDefault(require("../Thumbnail"));
const Config_1 = require("../../utilities/Config");
const useTitle_1 = require("../../../hooks/useTitle");
require("./index.scss");
const baseClass = 'thumbnail-card';
const ThumbnailCard = (props) => {
    const { className, onClick, doc, collection, thumbnail, label: labelFromProps, alignLabel, onKeyDown, } = props;
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const config = (0, Config_1.useConfig)();
    const classes = [
        baseClass,
        className,
        typeof onClick === 'function' && `${baseClass}--has-on-click`,
        alignLabel && `${baseClass}--align-label-${alignLabel}`,
    ].filter(Boolean).join(' ');
    let title = labelFromProps;
    if (!title) {
        title = (0, useTitle_1.formatUseAsTitle)({
            doc,
            collection,
            i18n,
            config,
        }) || (doc === null || doc === void 0 ? void 0 : doc.filename) || `[${t('untitled')}]`;
    }
    return (react_1.default.createElement("div", { title: title, className: classes, onClick: typeof onClick === 'function' ? onClick : undefined, onKeyDown: typeof onKeyDown === 'function' ? onKeyDown : undefined },
        react_1.default.createElement("div", { className: `${baseClass}__thumbnail` },
            thumbnail && thumbnail,
            !thumbnail && (collection && doc) && (react_1.default.createElement(Thumbnail_1.default, { size: "expand", doc: doc, collection: collection }))),
        react_1.default.createElement("div", { className: `${baseClass}__label` }, title)));
};
exports.ThumbnailCard = ThumbnailCard;
//# sourceMappingURL=index.js.map