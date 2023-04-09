"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const __1 = __importDefault(require("../.."));
const Label_1 = __importDefault(require("../../Label"));
const types_1 = require("../../../../../../../fields/config/types");
const getUniqueListBy_1 = __importDefault(require("../../../../../../../utilities/getUniqueListBy"));
const getTranslation_1 = require("../../../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'iterable-diff';
const Iterable = ({ version, comparison, permissions, field, locale, locales, fieldComponents, }) => {
    var _a, _b;
    const versionRowCount = Array.isArray(version) ? version.length : 0;
    const comparisonRowCount = Array.isArray(comparison) ? comparison.length : 0;
    const maxRows = Math.max(versionRowCount, comparisonRowCount);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    return (react_1.default.createElement("div", { className: baseClass },
        field.label && (react_1.default.createElement(Label_1.default, null,
            locale && (react_1.default.createElement("span", { className: `${baseClass}__locale-label` }, locale)),
            (0, getTranslation_1.getTranslation)(field.label, i18n))),
        maxRows > 0 && (react_1.default.createElement(react_1.default.Fragment, null, Array.from(Array(maxRows).keys()).map((row, i) => {
            const versionRow = (version === null || version === void 0 ? void 0 : version[i]) || {};
            const comparisonRow = (comparison === null || comparison === void 0 ? void 0 : comparison[i]) || {};
            let subFields = [];
            if (field.type === 'array')
                subFields = field.fields;
            if (field.type === 'blocks') {
                subFields = [
                    {
                        name: 'blockType',
                        label: t('fields:blockType'),
                        type: 'text',
                    },
                ];
                if ((versionRow === null || versionRow === void 0 ? void 0 : versionRow.blockType) === (comparisonRow === null || comparisonRow === void 0 ? void 0 : comparisonRow.blockType)) {
                    const matchedBlock = field.blocks.find((block) => block.slug === (versionRow === null || versionRow === void 0 ? void 0 : versionRow.blockType)) || { fields: [] };
                    subFields = [
                        ...subFields,
                        ...matchedBlock.fields,
                    ];
                }
                else {
                    const matchedVersionBlock = field.blocks.find((block) => block.slug === (versionRow === null || versionRow === void 0 ? void 0 : versionRow.blockType)) || { fields: [] };
                    const matchedComparisonBlock = field.blocks.find((block) => block.slug === (comparisonRow === null || comparisonRow === void 0 ? void 0 : comparisonRow.blockType)) || { fields: [] };
                    subFields = (0, getUniqueListBy_1.default)([
                        ...subFields,
                        ...matchedVersionBlock.fields,
                        ...matchedComparisonBlock.fields,
                    ], 'name');
                }
            }
            return (react_1.default.createElement("div", { className: `${baseClass}__wrap`, key: i },
                react_1.default.createElement(__1.default, { locales: locales, version: versionRow, comparison: comparisonRow, fieldPermissions: permissions, fields: subFields.filter((subField) => !((0, types_1.fieldAffectsData)(subField) && subField.name === 'id')), fieldComponents: fieldComponents })));
        }))),
        maxRows === 0 && (react_1.default.createElement("div", { className: `${baseClass}__no-rows` }, t('noRowsFound', { label: ((_a = field.labels) === null || _a === void 0 ? void 0 : _a.plural) ? (0, getTranslation_1.getTranslation)((_b = field.labels) === null || _b === void 0 ? void 0 : _b.plural, i18n) : t('general:rows') })))));
};
exports.default = Iterable;
//# sourceMappingURL=index.js.map