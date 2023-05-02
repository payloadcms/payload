"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_diff_viewer_1 = __importDefault(require("react-diff-viewer"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../../utilities/Config");
const Locale_1 = require("../../../../../utilities/Locale");
const types_1 = require("../../../../../../../fields/config/types");
const Label_1 = __importDefault(require("../../Label"));
const styles_1 = require("../styles");
const getTranslation_1 = require("../../../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'relationship-diff';
const generateLabelFromValue = (collections, field, locale, value) => {
    var _a;
    let relation;
    let relatedDoc;
    let valueToReturn = '';
    if (Array.isArray(field.relationTo)) {
        if (typeof value === 'object') {
            relation = value.relationTo;
            relatedDoc = value.value;
        }
    }
    else {
        relation = field.relationTo;
        relatedDoc = value;
    }
    const relatedCollection = collections.find((c) => c.slug === relation);
    if (relatedCollection) {
        const useAsTitle = (_a = relatedCollection === null || relatedCollection === void 0 ? void 0 : relatedCollection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle;
        const useAsTitleField = relatedCollection.fields.find((f) => ((0, types_1.fieldAffectsData)(f) && !(0, types_1.fieldIsPresentationalOnly)(f)) && f.name === useAsTitle);
        let titleFieldIsLocalized = false;
        if (useAsTitleField && (0, types_1.fieldAffectsData)(useAsTitleField))
            titleFieldIsLocalized = useAsTitleField.localized;
        if (typeof (relatedDoc === null || relatedDoc === void 0 ? void 0 : relatedDoc[useAsTitle]) !== 'undefined') {
            valueToReturn = relatedDoc[useAsTitle];
        }
        else if (typeof (relatedDoc === null || relatedDoc === void 0 ? void 0 : relatedDoc.id) !== 'undefined') {
            valueToReturn = relatedDoc.id;
        }
        if (typeof valueToReturn === 'object' && titleFieldIsLocalized) {
            valueToReturn = valueToReturn[locale];
        }
    }
    return valueToReturn;
};
const Relationship = ({ field, version, comparison }) => {
    const { collections } = (0, Config_1.useConfig)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const locale = (0, Locale_1.useLocale)();
    let placeholder = '';
    if (version === comparison)
        placeholder = `[${t('noValue')}]`;
    let versionToRender = version;
    let comparisonToRender = comparison;
    if (field.hasMany) {
        if (Array.isArray(version))
            versionToRender = version.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ');
        if (Array.isArray(comparison))
            comparisonToRender = comparison.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ');
    }
    else {
        versionToRender = generateLabelFromValue(collections, field, locale, version);
        comparisonToRender = generateLabelFromValue(collections, field, locale, comparison);
    }
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Label_1.default, null,
            locale && (react_1.default.createElement("span", { className: `${baseClass}__locale-label` }, locale)),
            (0, getTranslation_1.getTranslation)(field.label, i18n)),
        react_1.default.createElement(react_diff_viewer_1.default, { styles: styles_1.diffStyles, oldValue: typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder, newValue: typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder, splitView: true, hideLineNumbers: true, showDiffOnly: false })));
    return null;
};
exports.default = Relationship;
//# sourceMappingURL=index.js.map