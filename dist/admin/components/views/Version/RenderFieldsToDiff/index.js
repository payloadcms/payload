"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const types_1 = require("../../../../../fields/config/types");
const Nested_1 = __importDefault(require("./fields/Nested"));
const diffMethods_1 = require("./fields/diffMethods");
require("./index.scss");
const baseClass = 'render-field-diffs';
const RenderFieldsToDiff = ({ fields, fieldComponents, fieldPermissions, version, comparison, locales, }) => (react_1.default.createElement("div", { className: baseClass }, fields.map((field, i) => {
    var _a, _b, _c;
    const Component = fieldComponents[field.type];
    const isRichText = field.type === 'richText';
    const diffMethod = diffMethods_1.diffMethods[field.type] || 'CHARS';
    if (Component) {
        if ((0, types_1.fieldAffectsData)(field)) {
            const valueIsObject = field.type === 'code' || field.type === 'json';
            const versionValue = valueIsObject ? JSON.stringify(version === null || version === void 0 ? void 0 : version[field.name]) : version === null || version === void 0 ? void 0 : version[field.name];
            const comparisonValue = valueIsObject ? JSON.stringify(comparison === null || comparison === void 0 ? void 0 : comparison[field.name]) : comparison === null || comparison === void 0 ? void 0 : comparison[field.name];
            const hasPermission = (_b = (_a = fieldPermissions === null || fieldPermissions === void 0 ? void 0 : fieldPermissions[field.name]) === null || _a === void 0 ? void 0 : _a.read) === null || _b === void 0 ? void 0 : _b.permission;
            const subFieldPermissions = (_c = fieldPermissions === null || fieldPermissions === void 0 ? void 0 : fieldPermissions[field.name]) === null || _c === void 0 ? void 0 : _c.fields;
            if (hasPermission === false)
                return null;
            if (field.localized) {
                return (react_1.default.createElement("div", { className: `${baseClass}__field`, key: i }, locales.map((locale) => {
                    const versionLocaleValue = versionValue === null || versionValue === void 0 ? void 0 : versionValue[locale];
                    const comparisonLocaleValue = comparisonValue === null || comparisonValue === void 0 ? void 0 : comparisonValue[locale];
                    return (react_1.default.createElement("div", { className: `${baseClass}__locale`, key: locale },
                        react_1.default.createElement("div", { className: `${baseClass}__locale-value` },
                            react_1.default.createElement(Component, { diffMethod: diffMethod, locale: locale, locales: locales, field: field, fieldComponents: fieldComponents, version: versionLocaleValue, comparison: comparisonLocaleValue, permissions: subFieldPermissions, isRichText: isRichText }))));
                })));
            }
            return (react_1.default.createElement("div", { className: `${baseClass}__field`, key: i },
                react_1.default.createElement(Component, { diffMethod: diffMethod, locales: locales, field: field, fieldComponents: fieldComponents, version: versionValue, comparison: comparisonValue, permissions: subFieldPermissions, isRichText: isRichText })));
        }
        if (field.type === 'tabs') {
            const Tabs = fieldComponents.tabs;
            return (react_1.default.createElement(Tabs, { key: i, version: version, comparison: comparison, field: field, locales: locales, fieldComponents: fieldComponents }));
        }
        // At this point, we are dealing with a `row` or similar
        if ((0, types_1.fieldHasSubFields)(field)) {
            return (react_1.default.createElement(Nested_1.default, { key: i, locales: locales, disableGutter: true, field: field, fieldComponents: fieldComponents, version: version, comparison: comparison, permissions: fieldPermissions }));
        }
    }
    return null;
})));
exports.default = RenderFieldsToDiff;
//# sourceMappingURL=index.js.map