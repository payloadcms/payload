import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js';
import { getFieldByPath } from '../../utilities/getFieldByPath.js';
export const sanitizeCompoundIndexes = ({ fields, indexes })=>{
    const sanitizedCompoundIndexes = [];
    for (const index of indexes){
        const sanitized = {
            fields: [],
            unique: index.unique ?? false
        };
        for (const path of index.fields){
            const result = getFieldByPath({
                fields,
                path
            });
            if (!result) {
                throw new InvalidConfiguration(`Field ${path} was not found`);
            }
            const { field, localizedPath, pathHasLocalized } = result;
            if ([
                'array',
                'blocks',
                'group',
                'tab'
            ].includes(field.type)) {
                throw new InvalidConfiguration(`Compound index on ${field.type} cannot be set. Path: ${localizedPath}`);
            }
            sanitized.fields.push({
                field,
                localizedPath,
                path,
                pathHasLocalized
            });
        }
        sanitizedCompoundIndexes.push(sanitized);
    }
    return sanitizedCompoundIndexes;
};

//# sourceMappingURL=sanitizeCompoundIndexes.js.map