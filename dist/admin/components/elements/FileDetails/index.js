"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_animate_height_1 = __importDefault(require("react-animate-height"));
const react_i18next_1 = require("react-i18next");
const Thumbnail_1 = __importDefault(require("../Thumbnail"));
const Button_1 = __importDefault(require("../Button"));
const Meta_1 = __importDefault(require("./Meta"));
const Chevron_1 = __importDefault(require("../../icons/Chevron"));
require("./index.scss");
const baseClass = 'file-details';
// sort to the same as imageSizes
const sortSizes = (sizes, imageSizes) => {
    if (!imageSizes || imageSizes.length === 0)
        return sizes;
    const orderedSizes = {};
    imageSizes.forEach(({ name }) => {
        if (sizes[name]) {
            orderedSizes[name] = sizes[name];
        }
    });
    return orderedSizes;
};
const FileDetails = (props) => {
    var _a;
    const { doc, collection, handleRemove, } = props;
    const { upload: { staticURL, imageSizes, }, } = collection;
    const { filename, filesize, width, height, mimeType, sizes, url, } = doc;
    const [orderedSizes, setOrderedSizes] = (0, react_1.useState)(() => sortSizes(sizes, imageSizes));
    (0, react_1.useEffect)(() => {
        setOrderedSizes(sortSizes(sizes, imageSizes));
    }, [sizes, imageSizes]);
    const [moreInfoOpen, setMoreInfoOpen] = (0, react_1.useState)(false);
    const { t } = (0, react_i18next_1.useTranslation)('upload');
    const hasSizes = sizes && ((_a = Object.keys(sizes)) === null || _a === void 0 ? void 0 : _a.length) > 0;
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("header", null,
            react_1.default.createElement(Thumbnail_1.default, { doc: doc, collection: collection }),
            react_1.default.createElement("div", { className: `${baseClass}__main-detail` },
                react_1.default.createElement(Meta_1.default, { staticURL: staticURL, filename: filename, filesize: filesize, width: width, height: height, mimeType: mimeType, url: url }),
                hasSizes && (react_1.default.createElement(Button_1.default, { className: `${baseClass}__toggle-more-info${moreInfoOpen ? ' open' : ''}`, buttonStyle: "none", onClick: () => setMoreInfoOpen(!moreInfoOpen) },
                    !moreInfoOpen && (react_1.default.createElement(react_1.default.Fragment, null,
                        t('moreInfo'),
                        react_1.default.createElement(Chevron_1.default, null))),
                    moreInfoOpen && (react_1.default.createElement(react_1.default.Fragment, null,
                        t('lessInfo'),
                        react_1.default.createElement(Chevron_1.default, null)))))),
            handleRemove && (react_1.default.createElement(Button_1.default, { icon: "x", round: true, buttonStyle: "icon-label", iconStyle: "with-border", onClick: handleRemove, className: `${baseClass}__remove` }))),
        hasSizes && (react_1.default.createElement(react_animate_height_1.default, { className: `${baseClass}__more-info`, height: moreInfoOpen ? 'auto' : 0 },
            react_1.default.createElement("ul", { className: `${baseClass}__sizes` }, Object.entries(orderedSizes).map(([key, val]) => {
                if (val === null || val === void 0 ? void 0 : val.filename) {
                    return (react_1.default.createElement("li", { key: key },
                        react_1.default.createElement("div", { className: `${baseClass}__size-label` }, key),
                        react_1.default.createElement(Meta_1.default, { ...val, mimeType: val.mimeType, staticURL: staticURL })));
                }
                return null;
            }))))));
};
exports.default = FileDetails;
//# sourceMappingURL=index.js.map