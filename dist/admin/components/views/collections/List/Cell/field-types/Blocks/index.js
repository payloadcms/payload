"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../../../../../utilities/getTranslation");
const BlocksCell = ({ data, field }) => {
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const selectedBlocks = data ? data.map(({ blockType }) => blockType) : [];
    const blockLabels = field.blocks.map((s) => ({ slug: s.slug, label: (0, getTranslation_1.getTranslation)(s.labels.singular, i18n) }));
    let label = `0 ${(0, getTranslation_1.getTranslation)(field.labels.plural, i18n)}`;
    const formatBlockList = (blocks) => blocks.map((b) => {
        var _a;
        const filtered = (_a = blockLabels.filter((f) => f.slug === b)) === null || _a === void 0 ? void 0 : _a[0];
        return filtered === null || filtered === void 0 ? void 0 : filtered.label;
    }).join(', ');
    const itemsToShow = 5;
    if (selectedBlocks.length > itemsToShow) {
        const more = selectedBlocks.length - itemsToShow;
        label = `${selectedBlocks.length} ${(0, getTranslation_1.getTranslation)(field.labels.plural, i18n)} - ${t('fields:itemsAndMore', { items: formatBlockList(selectedBlocks.slice(0, itemsToShow)), count: more })}`;
    }
    else if (selectedBlocks.length > 0) {
        label = `${selectedBlocks.length} ${(0, getTranslation_1.getTranslation)(selectedBlocks.length === 1 ? field.labels.singular : field.labels.plural, i18n)} - ${formatBlockList(selectedBlocks)}`;
    }
    return (react_1.default.createElement("span", null, label));
};
exports.default = BlocksCell;
//# sourceMappingURL=index.js.map