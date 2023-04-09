"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldIsLocalized = exports.tabHasName = exports.fieldAffectsData = exports.fieldIsPresentationalOnly = exports.fieldHasMaxDepth = exports.fieldSupportsMany = exports.optionIsValue = exports.optionsAreObjects = exports.optionIsObject = exports.fieldIsBlockType = exports.fieldIsArrayType = exports.fieldHasSubFields = exports.valueIsValueWithRelation = void 0;
function valueIsValueWithRelation(value) {
    return value !== null && typeof value === 'object' && 'relationTo' in value && 'value' in value;
}
exports.valueIsValueWithRelation = valueIsValueWithRelation;
function fieldHasSubFields(field) {
    return (field.type === 'group' || field.type === 'array' || field.type === 'row' || field.type === 'collapsible');
}
exports.fieldHasSubFields = fieldHasSubFields;
function fieldIsArrayType(field) {
    return field.type === 'array';
}
exports.fieldIsArrayType = fieldIsArrayType;
function fieldIsBlockType(field) {
    return field.type === 'blocks';
}
exports.fieldIsBlockType = fieldIsBlockType;
function optionIsObject(option) {
    return typeof option === 'object';
}
exports.optionIsObject = optionIsObject;
function optionsAreObjects(options) {
    return Array.isArray(options) && typeof (options === null || options === void 0 ? void 0 : options[0]) === 'object';
}
exports.optionsAreObjects = optionsAreObjects;
function optionIsValue(option) {
    return typeof option === 'string';
}
exports.optionIsValue = optionIsValue;
function fieldSupportsMany(field) {
    return field.type === 'select' || field.type === 'relationship';
}
exports.fieldSupportsMany = fieldSupportsMany;
function fieldHasMaxDepth(field) {
    return (field.type === 'upload' || field.type === 'relationship') && typeof field.maxDepth === 'number';
}
exports.fieldHasMaxDepth = fieldHasMaxDepth;
function fieldIsPresentationalOnly(field) {
    return field.type === 'ui';
}
exports.fieldIsPresentationalOnly = fieldIsPresentationalOnly;
function fieldAffectsData(field) {
    return 'name' in field && !fieldIsPresentationalOnly(field);
}
exports.fieldAffectsData = fieldAffectsData;
function tabHasName(tab) {
    return 'name' in tab;
}
exports.tabHasName = tabHasName;
function fieldIsLocalized(field) {
    return 'localized' in field && field.localized;
}
exports.fieldIsLocalized = fieldIsLocalized;
//# sourceMappingURL=types.js.map