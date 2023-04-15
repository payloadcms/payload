"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../../../../utilities/getTranslation");
const DefaultBlockImage_1 = __importDefault(require("../../../../../graphics/DefaultBlockImage"));
require("./index.scss");
const baseClass = 'block-selection';
const BlockSelection = (props) => {
    const { addRow, addRowIndex, block, close, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const { labels, slug, imageURL, imageAltText, } = block;
    const handleBlockSelection = () => {
        close();
        addRow(addRowIndex, slug);
    };
    return (react_1.default.createElement("button", { className: baseClass, tabIndex: 0, type: "button", onClick: handleBlockSelection },
        react_1.default.createElement("div", { className: `${baseClass}__image` }, imageURL
            ? (react_1.default.createElement("img", { src: imageURL, alt: imageAltText }))
            : react_1.default.createElement(DefaultBlockImage_1.default, null)),
        react_1.default.createElement("div", { className: `${baseClass}__label` }, (0, getTranslation_1.getTranslation)(labels.singular, i18n))));
};
exports.default = BlockSelection;
//# sourceMappingURL=index.js.map