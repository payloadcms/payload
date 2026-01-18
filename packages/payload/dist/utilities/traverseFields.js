import { fieldAffectsData, fieldHasSubFields, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js';
const traverseArrayOrBlocksField = ({ callback, callbackStack, config, data, field, fillEmpty, leavesFirst, parentIsLocalized, parentPath, parentRef })=>{
    if (fillEmpty) {
        if (field.type === 'array') {
            traverseFields({
                callback,
                callbackStack,
                config,
                fields: field.fields,
                isTopLevel: false,
                leavesFirst,
                parentIsLocalized: parentIsLocalized || field.localized,
                parentPath: `${parentPath}${field.name}.`,
                parentRef
            });
        }
        if (field.type === 'blocks') {
            for (const _block of field.blockReferences ?? field.blocks){
                // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
                const block = typeof _block === 'string' ? config?.blocks?.find((b)=>b.slug === _block) : _block;
                if (block) {
                    traverseFields({
                        callback,
                        callbackStack,
                        config,
                        fields: block.fields,
                        isTopLevel: false,
                        leavesFirst,
                        parentIsLocalized: parentIsLocalized || field.localized,
                        parentPath: `${parentPath}${field.name}.`,
                        parentRef
                    });
                }
            }
        }
        return;
    }
    for (const ref of data){
        let fields;
        if (field.type === 'blocks' && typeof ref?.blockType === 'string') {
            // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
            const block = field.blockReferences ? config?.blocks?.find((b)=>b.slug === ref.blockType) ?? field.blockReferences.find((b)=>typeof b !== 'string' && b.slug === ref.blockType) : field.blocks.find((b)=>b.slug === ref.blockType);
            fields = block?.fields;
        } else if (field.type === 'array') {
            fields = field.fields;
        }
        if (fields) {
            traverseFields({
                callback,
                callbackStack,
                config,
                fields,
                fillEmpty,
                isTopLevel: false,
                leavesFirst,
                parentIsLocalized: parentIsLocalized || field.localized,
                parentPath: `${parentPath}${field.name}.`,
                parentRef,
                ref
            });
        }
    }
};
/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param fillEmpty fill empty properties to use this without data
 * @param ref the data or any artifacts assigned in the callback during field recursion
 * @param parentRef the data or any artifacts assigned in the callback during field recursion one level up
 */ export const traverseFields = ({ callback, callbackStack: _callbackStack = [], config, fields, fillEmpty = true, isTopLevel = true, leavesFirst = false, parentIsLocalized, parentPath = '', parentRef = {}, ref = {} })=>{
    const fieldsMatched = fields.some((field)=>{
        let callbackStack = [];
        if (!isTopLevel) {
            callbackStack = _callbackStack;
        }
        let skip = false;
        const next = ()=>{
            skip = true;
        };
        if (!ref || typeof ref !== 'object') {
            return;
        }
        if (!leavesFirst && callback && callback({
            field,
            next,
            parentIsLocalized: parentIsLocalized,
            parentPath,
            parentRef,
            ref
        })) {
            return true;
        } else if (leavesFirst) {
            callbackStack.push(()=>callback({
                    field,
                    next,
                    parentIsLocalized: parentIsLocalized,
                    parentPath,
                    parentRef,
                    ref
                }));
        }
        if (skip) {
            return false;
        }
        // avoid mutation of ref for all fields
        let currentRef = ref;
        let currentParentRef = parentRef;
        if (field.type === 'tabs' && 'tabs' in field) {
            for (const tab of field.tabs){
                let tabRef = ref;
                if (skip) {
                    return false;
                }
                if ('name' in tab && tab.name) {
                    if (!ref[tab.name] || typeof ref[tab.name] !== 'object') {
                        if (fillEmpty) {
                            if (tab.localized) {
                                ;
                                ref[tab.name] = {
                                    en: {}
                                };
                            } else {
                                ;
                                ref[tab.name] = {};
                            }
                        } else {
                            continue;
                        }
                    }
                    if (callback && !leavesFirst && callback({
                        field: {
                            ...tab,
                            type: 'tab'
                        },
                        next,
                        parentIsLocalized: parentIsLocalized,
                        parentPath,
                        parentRef: currentParentRef,
                        ref: tabRef
                    })) {
                        return true;
                    } else if (leavesFirst) {
                        callbackStack.push(()=>callback({
                                field: {
                                    ...tab,
                                    type: 'tab'
                                },
                                next,
                                parentIsLocalized: parentIsLocalized,
                                parentPath,
                                parentRef: currentParentRef,
                                ref: tabRef
                            }));
                    }
                    tabRef = tabRef[tab.name];
                    if (tab.localized) {
                        for(const key in tabRef){
                            if (tabRef[key] && typeof tabRef[key] === 'object') {
                                traverseFields({
                                    callback,
                                    callbackStack,
                                    config,
                                    fields: tab.fields,
                                    fillEmpty,
                                    isTopLevel: false,
                                    leavesFirst,
                                    parentIsLocalized: true,
                                    parentPath: `${parentPath}${tab.name}.`,
                                    parentRef: currentParentRef,
                                    ref: tabRef[key]
                                });
                            }
                        }
                    }
                } else {
                    if (callback && !leavesFirst && callback({
                        field: {
                            ...tab,
                            type: 'tab'
                        },
                        next,
                        parentIsLocalized: parentIsLocalized,
                        parentPath,
                        parentRef: currentParentRef,
                        ref: tabRef
                    })) {
                        return true;
                    } else if (leavesFirst) {
                        callbackStack.push(()=>callback({
                                field: {
                                    ...tab,
                                    type: 'tab'
                                },
                                next,
                                parentIsLocalized: parentIsLocalized,
                                parentPath,
                                parentRef: currentParentRef,
                                ref: tabRef
                            }));
                    }
                }
                if (!tab.localized) {
                    traverseFields({
                        callback,
                        callbackStack,
                        config,
                        fields: tab.fields,
                        fillEmpty,
                        isTopLevel: false,
                        leavesFirst,
                        parentIsLocalized: false,
                        parentPath: tabHasName(tab) ? `${parentPath}${tab.name}` : parentPath,
                        parentRef: currentParentRef,
                        ref: tabRef
                    });
                }
                if (skip) {
                    return false;
                }
            }
            return;
        }
        if (field.type === 'tab' || fieldHasSubFields(field) || field.type === 'blocks') {
            if ('name' in field && field.name) {
                currentParentRef = currentRef;
                if (!ref[field.name]) {
                    if (fillEmpty) {
                        if (field.type === 'group' || field.type === 'tab') {
                            if (fieldShouldBeLocalized({
                                field,
                                parentIsLocalized: parentIsLocalized
                            })) {
                                ;
                                ref[field.name] = {
                                    en: {}
                                };
                            } else {
                                ;
                                ref[field.name] = {};
                            }
                        } else if (field.type === 'array' || field.type === 'blocks') {
                            if (fieldShouldBeLocalized({
                                field,
                                parentIsLocalized: parentIsLocalized
                            })) {
                                ;
                                ref[field.name] = {
                                    en: []
                                };
                            } else {
                                ;
                                ref[field.name] = [];
                            }
                        }
                    } else {
                        return;
                    }
                }
                currentRef = ref[field.name];
            }
            if ((field.type === 'tab' || field.type === 'group') && fieldShouldBeLocalized({
                field,
                parentIsLocalized: parentIsLocalized
            }) && currentRef && typeof currentRef === 'object') {
                if (fieldAffectsData(field)) {
                    for(const key in currentRef){
                        if (currentRef[key]) {
                            traverseFields({
                                callback,
                                callbackStack,
                                config,
                                fields: field.fields,
                                fillEmpty,
                                isTopLevel: false,
                                leavesFirst,
                                parentIsLocalized: true,
                                parentPath: field.name ? `${parentPath}${field.name}.` : parentPath,
                                parentRef: currentParentRef,
                                ref: currentRef[key]
                            });
                        }
                    }
                } else {
                    traverseFields({
                        callback,
                        callbackStack,
                        config,
                        fields: field.fields,
                        fillEmpty,
                        isTopLevel: false,
                        leavesFirst,
                        parentIsLocalized,
                        parentRef: currentParentRef,
                        ref: currentRef
                    });
                }
                return;
            }
            if ((field.type === 'blocks' || field.type === 'array') && currentRef && typeof currentRef === 'object') {
                // TODO: `?? field.localized ?? false` shouldn't be necessary, but right now it
                // is so that all fields are correctly traversed in copyToLocale and
                // therefore pass the localization integration tests.
                // I tried replacing the `!parentIsLocalized` condition with `parentIsLocalized === false`
                // in `fieldShouldBeLocalized`, but several tests failed. We must be calling it with incorrect
                // parameters somewhere.
                if (fieldShouldBeLocalized({
                    field,
                    parentIsLocalized: parentIsLocalized ?? false
                })) {
                    if (Array.isArray(currentRef)) {
                        traverseArrayOrBlocksField({
                            callback,
                            callbackStack,
                            config,
                            data: currentRef,
                            field,
                            fillEmpty,
                            leavesFirst,
                            parentIsLocalized: true,
                            parentPath,
                            parentRef: currentParentRef
                        });
                    } else {
                        for(const key in currentRef){
                            const localeData = currentRef[key];
                            if (!Array.isArray(localeData)) {
                                continue;
                            }
                            traverseArrayOrBlocksField({
                                callback,
                                callbackStack,
                                config,
                                data: localeData,
                                field,
                                fillEmpty,
                                leavesFirst,
                                parentIsLocalized: true,
                                parentPath,
                                parentRef: currentParentRef
                            });
                        }
                    }
                } else if (Array.isArray(currentRef)) {
                    traverseArrayOrBlocksField({
                        callback,
                        callbackStack,
                        config,
                        data: currentRef,
                        field,
                        fillEmpty,
                        leavesFirst,
                        parentIsLocalized: parentIsLocalized,
                        parentPath,
                        parentRef: currentParentRef
                    });
                }
            } else if (currentRef && typeof currentRef === 'object' && 'fields' in field) {
                traverseFields({
                    callback,
                    callbackStack,
                    config,
                    fields: field.fields,
                    fillEmpty,
                    isTopLevel: false,
                    leavesFirst,
                    parentIsLocalized,
                    parentPath: 'name' in field && field.name ? `${parentPath}${field.name}.` : parentPath,
                    parentRef: currentParentRef,
                    ref: currentRef
                });
            }
        }
        if (isTopLevel) {
            callbackStack.reverse().forEach((cb)=>{
                cb();
            });
        }
    });
    // Fallback: Handle dot-notation paths when no fields matched
    if (!fieldsMatched && ref && typeof ref === 'object') {
        Object.keys(ref).forEach((key)=>{
            if (key.includes('.')) {
                // Split on first dot only
                const firstDotIndex = key.indexOf('.');
                const fieldName = key.substring(0, firstDotIndex);
                const remainingPath = key.substring(firstDotIndex + 1);
                // Create nested structure for this field
                if (!ref[fieldName]) {
                    ;
                    ref[fieldName] = {};
                }
                const nestedRef = ref[fieldName];
                // Move the value to the nested structure
                nestedRef[remainingPath] = ref[key];
                delete ref[key];
                // Recursively process the newly created nested structure
                // The field traversal will naturally handle it if the field exists in the schema
                traverseFields({
                    callback,
                    callbackStack: _callbackStack,
                    config,
                    fields,
                    fillEmpty,
                    isTopLevel: false,
                    leavesFirst,
                    parentIsLocalized,
                    parentPath,
                    parentRef,
                    ref
                });
            }
        });
    }
};

//# sourceMappingURL=traverseFields.js.map