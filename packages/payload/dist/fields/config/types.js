/* eslint-disable @typescript-eslint/no-explicit-any */ export function valueIsValueWithRelation(value) {
    return value !== null && typeof value === 'object' && 'relationTo' in value && 'value' in value;
}
export function fieldHasSubFields(field) {
    return field.type === 'group' || field.type === 'array' || field.type === 'row' || field.type === 'collapsible';
}
export function fieldIsArrayType(field) {
    return field.type === 'array';
}
export function fieldIsBlockType(field) {
    return field.type === 'blocks';
}
export function fieldIsGroupType(field) {
    return field.type === 'group';
}
export function optionIsObject(option) {
    return typeof option === 'object';
}
export function optionsAreObjects(options) {
    return Array.isArray(options) && typeof options?.[0] === 'object';
}
export function optionIsValue(option) {
    return typeof option === 'string';
}
export function fieldSupportsMany(field) {
    return field.type === 'select' || field.type === 'relationship' || field.type === 'upload';
}
export function fieldHasMaxDepth(field) {
    return (field.type === 'upload' || field.type === 'relationship' || field.type === 'join') && typeof field.maxDepth === 'number';
}
export function fieldIsPresentationalOnly(field) {
    return field.type === 'ui';
}
export function fieldIsSidebar(field) {
    return 'admin' in field && 'position' in field.admin && field.admin.position === 'sidebar';
}
export function fieldIsID(field) {
    return 'name' in field && field.name === 'id';
}
export function fieldIsHiddenOrDisabled(field) {
    return 'hidden' in field && field.hidden || 'admin' in field && 'disabled' in field.admin && field.admin.disabled;
}
export function fieldAffectsData(field) {
    return 'name' in field && !fieldIsPresentationalOnly(field);
}
export function tabHasName(tab) {
    return 'name' in tab;
}
export function groupHasName(group) {
    return 'name' in group;
}
/**
 * Check if a field has localized: true set. This does not check if a field *should*
 * be localized. To check if a field should be localized, use `fieldShouldBeLocalized`.
 *
 * @deprecated this will be removed or modified in v4.0, as `fieldIsLocalized` can easily lead to bugs due to
 * parent field localization not being taken into account.
 */ export function fieldIsLocalized(field) {
    return 'localized' in field && field.localized;
}
/**
 * Similar to `fieldIsLocalized`, but returns `false` if any parent field is localized.
 */ export function fieldShouldBeLocalized({ field, parentIsLocalized }) {
    return 'localized' in field && field.localized && (!parentIsLocalized || process.env.NEXT_PUBLIC_PAYLOAD_COMPATIBILITY_allowLocalizedWithinLocalized === 'true');
}
export function fieldIsVirtual(field) {
    return 'virtual' in field && Boolean(field.virtual);
}

//# sourceMappingURL=types.js.map