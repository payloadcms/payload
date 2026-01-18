import { deepMergeSimple } from '@payloadcms/translations/utilities';
import { getSelectMode } from './getSelectMode.js';
// Transform post.title -> post, post.category.title -> post
const stripVirtualPathToCurrentCollection = ({ fields, path, versions })=>{
    const resultSegments = [];
    if (versions) {
        resultSegments.push('version');
        const versionField = fields.find((each)=>each.name === 'version');
        if (versionField && versionField.type === 'group') {
            fields = versionField.flattenedFields;
        }
    }
    for (const segment of path.split('.')){
        const field = fields.find((each)=>each.name === segment);
        if (!field) {
            continue;
        }
        resultSegments.push(segment);
        if (field.type === 'relationship' || field.type === 'upload') {
            return resultSegments.join('.');
        }
    }
    return resultSegments.join('.');
};
const getAllVirtualRelations = ({ fields })=>{
    const result = [];
    for (const field of fields){
        if ('virtual' in field && typeof field.virtual === 'string') {
            result.push(field.virtual);
        } else if (field.type === 'group' || field.type === 'tab') {
            const nestedResult = getAllVirtualRelations({
                fields: field.flattenedFields
            });
            for (const nestedItem of nestedResult){
                result.push(nestedItem);
            }
        }
    }
    return result;
};
const resolveVirtualRelationsToSelect = ({ fields, selectValue, topLevelFields, versions })=>{
    const result = [];
    if (selectValue === true) {
        for (const item of getAllVirtualRelations({
            fields
        })){
            result.push(stripVirtualPathToCurrentCollection({
                fields: topLevelFields,
                path: item,
                versions
            }));
        }
    } else {
        for(const fieldName in selectValue){
            const field = fields.find((each)=>each.name === fieldName);
            if (!field) {
                continue;
            }
            if ('virtual' in field && typeof field.virtual === 'string') {
                result.push(stripVirtualPathToCurrentCollection({
                    fields: topLevelFields,
                    path: field.virtual,
                    versions
                }));
            } else if (field.type === 'group' || field.type === 'tab') {
                for (const item of resolveVirtualRelationsToSelect({
                    fields: field.flattenedFields,
                    selectValue: selectValue[fieldName],
                    topLevelFields,
                    versions
                })){
                    result.push(stripVirtualPathToCurrentCollection({
                        fields: topLevelFields,
                        path: item,
                        versions
                    }));
                }
            }
        }
    }
    return result;
};
export const sanitizeSelect = ({ fields, forceSelect, select, versions })=>{
    if (!select) {
        return select;
    }
    const selectMode = getSelectMode(select);
    if (selectMode === 'exclude') {
        return select;
    }
    if (forceSelect) {
        select = deepMergeSimple(select, forceSelect);
    }
    if (select) {
        const virtualRelations = resolveVirtualRelationsToSelect({
            fields,
            selectValue: select,
            topLevelFields: fields,
            versions: versions ?? false
        });
        for (const path of virtualRelations){
            let currentRef = select;
            const segments = path.split('.');
            for(let i = 0; i < segments.length; i++){
                const isLast = segments.length - 1 === i;
                const segment = segments[i];
                if (isLast) {
                    currentRef[segment] = true;
                } else {
                    if (!(segment in currentRef)) {
                        currentRef[segment] = {};
                        currentRef = currentRef[segment];
                    }
                }
            }
        }
    }
    return select;
};

//# sourceMappingURL=sanitizeSelect.js.map