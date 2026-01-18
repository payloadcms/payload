import { fieldAffectsData, tabHasName } from '../fields/config/types.js';
export const flattenBlock = ({ block })=>{
    return {
        ...block,
        flattenedFields: flattenAllFields({
            fields: block.fields
        })
    };
};
const flattenedFieldsCache = new Map();
/**
 * Flattens all fields in a collection, preserving the nested field structure.
 * @param cache
 * @param fields
 */ export const flattenAllFields = ({ cache, fields })=>{
    if (cache) {
        const maybeFields = flattenedFieldsCache.get(fields);
        if (maybeFields) {
            return maybeFields;
        }
    }
    const result = [];
    for (const field of fields){
        switch(field.type){
            case 'array':
            case 'group':
                {
                    if (fieldAffectsData(field)) {
                        result.push({
                            ...field,
                            flattenedFields: flattenAllFields({
                                fields: field.fields
                            })
                        });
                    } else {
                        for (const nestedField of flattenAllFields({
                            fields: field.fields
                        })){
                            result.push(nestedField);
                        }
                    }
                    break;
                }
            case 'blocks':
                {
                    const blocks = [];
                    let blockReferences = undefined;
                    if (field.blockReferences) {
                        blockReferences = [];
                        for (const block of field.blockReferences){
                            if (typeof block === 'string') {
                                blockReferences.push(block);
                                continue;
                            }
                            blockReferences.push(flattenBlock({
                                block
                            }));
                        }
                    } else {
                        for (const block of field.blocks){
                            if (typeof block === 'string') {
                                blocks.push(block);
                                continue;
                            }
                            blocks.push(flattenBlock({
                                block
                            }));
                        }
                    }
                    const resultField = {
                        ...field,
                        blockReferences,
                        blocks
                    };
                    result.push(resultField);
                    break;
                }
            case 'collapsible':
            case 'row':
                {
                    for (const nestedField of flattenAllFields({
                        fields: field.fields
                    })){
                        result.push(nestedField);
                    }
                    break;
                }
            case 'join':
                {
                    result.push(field);
                    break;
                }
            case 'tabs':
                {
                    for (const tab of field.tabs){
                        if (!tabHasName(tab)) {
                            for (const nestedField of flattenAllFields({
                                fields: tab.fields
                            })){
                                result.push(nestedField);
                            }
                        } else {
                            result.push({
                                ...tab,
                                type: 'tab',
                                flattenedFields: flattenAllFields({
                                    fields: tab.fields
                                })
                            });
                        }
                    }
                    break;
                }
            default:
                {
                    if (field.type !== 'ui') {
                        result.push(field);
                    }
                }
        }
    }
    flattenedFieldsCache.set(fields, result);
    return result;
};

//# sourceMappingURL=flattenAllFields.js.map