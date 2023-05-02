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
exports.BlocksDrawer = void 0;
const react_1 = __importStar(require("react"));
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const BlockSearch_1 = __importDefault(require("./BlockSearch"));
const Drawer_1 = require("../../../../elements/Drawer");
const getTranslation_1 = require("../../../../../../utilities/getTranslation");
const ThumbnailCard_1 = require("../../../../elements/ThumbnailCard");
const DefaultBlockImage_1 = __importDefault(require("../../../../graphics/DefaultBlockImage"));
require("./index.scss");
const baseClass = 'blocks-drawer';
const getBlockLabel = (block, i18n) => {
    if (typeof block.labels.singular === 'string')
        return block.labels.singular.toLowerCase();
    if (typeof block.labels.singular === 'object') {
        return (0, getTranslation_1.getTranslation)(block.labels.singular, i18n).toLowerCase();
    }
    return '';
};
const BlocksDrawer = (props) => {
    const { blocks, addRow, addRowIndex, drawerSlug, labels, } = props;
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filteredBlocks, setFilteredBlocks] = (0, react_1.useState)(blocks);
    const { closeModal, isModalOpen } = (0, modal_1.useModal)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    (0, react_1.useEffect)(() => {
        if (!isModalOpen) {
            setSearchTerm('');
        }
    }, [isModalOpen]);
    (0, react_1.useEffect)(() => {
        const searchTermToUse = searchTerm.toLowerCase();
        const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
            const blockLabel = getBlockLabel(block, i18n);
            if (blockLabel.includes(searchTermToUse))
                matchedBlocks.push(block);
            return matchedBlocks;
        }, []);
        setFilteredBlocks(matchingBlocks);
    }, [searchTerm, blocks, i18n]);
    return (react_1.default.createElement(Drawer_1.Drawer, { slug: drawerSlug, title: t('addLabel', { label: (0, getTranslation_1.getTranslation)(labels.singular, i18n) }) },
        react_1.default.createElement(BlockSearch_1.default, { setSearchTerm: setSearchTerm }),
        react_1.default.createElement("div", { className: `${baseClass}__blocks-wrapper` },
            react_1.default.createElement("ul", { className: `${baseClass}__blocks` }, filteredBlocks === null || filteredBlocks === void 0 ? void 0 : filteredBlocks.map((block, index) => {
                const { labels: blockLabels, slug, imageURL, imageAltText, } = block;
                return (react_1.default.createElement("li", { key: index, className: `${baseClass}__block` },
                    react_1.default.createElement(ThumbnailCard_1.ThumbnailCard, { onClick: () => {
                            addRow(addRowIndex, slug);
                            closeModal(drawerSlug);
                        }, thumbnail: imageURL ? (react_1.default.createElement("img", { src: imageURL, alt: imageAltText })) : (react_1.default.createElement("div", { className: `${baseClass}__default-image` },
                            react_1.default.createElement(DefaultBlockImage_1.default, null))), label: (0, getTranslation_1.getTranslation)(blockLabels.singular, i18n), alignLabel: "center" })));
            })))));
};
exports.BlocksDrawer = BlocksDrawer;
//# sourceMappingURL=index.js.map