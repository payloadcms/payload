import { deepMergeWithReactComponents } from '../utilities/deepMerge.js';
import { fieldAffectsData, fieldHasSubFields } from './config/types.js';
export const mergeBaseFields = (fields, baseFields)=>{
    const mergedFields = [
        ...fields || []
    ];
    baseFields.forEach((baseField)=>{
        let matchedIndex = null;
        if (fieldAffectsData(baseField)) {
            const match = mergedFields.find((field, i)=>{
                if (fieldAffectsData(field) && field.name === baseField.name) {
                    matchedIndex = i;
                    return true;
                }
                return false;
            });
            if (match) {
                const matchCopy = {
                    ...match
                };
                mergedFields.splice(matchedIndex, 1);
                const mergedField = deepMergeWithReactComponents(baseField, matchCopy);
                if (fieldHasSubFields(baseField) && fieldHasSubFields(matchCopy)) {
                    ;
                    mergedField.fields = mergeBaseFields(matchCopy.fields, baseField.fields);
                }
                mergedFields.push(mergedField);
            } else {
                mergedFields.push(baseField);
            }
        }
    });
    return mergedFields;
};

//# sourceMappingURL=mergeBaseFields.js.map