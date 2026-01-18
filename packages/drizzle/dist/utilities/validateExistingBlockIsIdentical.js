import { fieldAffectsData, fieldHasSubFields, fieldShouldBeLocalized, tabHasName } from 'payload/shared';
const getFlattenedFieldNames = (args)=>{
    const { fields, parentIsLocalized, prefix = '' } = args;
    return fields.reduce((fieldsToUse, field)=>{
        let fieldPrefix = prefix;
        if ([
            'array',
            'blocks',
            'relationship',
            'upload'
        ].includes(field.type) || 'hasMany' in field && field.hasMany === true) {
            return fieldsToUse;
        }
        if (fieldHasSubFields(field)) {
            fieldPrefix = 'name' in field ? `${prefix}${field.name}_` : prefix;
            return [
                ...fieldsToUse,
                ...getFlattenedFieldNames({
                    fields: field.fields,
                    parentIsLocalized: parentIsLocalized || 'localized' in field && field.localized,
                    prefix: fieldPrefix
                })
            ];
        }
        if (field.type === 'tabs') {
            return [
                ...fieldsToUse,
                ...field.tabs.reduce((tabFields, tab)=>{
                    fieldPrefix = 'name' in tab ? `${prefix}_${tab.name}` : prefix;
                    return [
                        ...tabFields,
                        ...tabHasName(tab) ? [
                            {
                                ...tab,
                                type: 'tab'
                            }
                        ] : getFlattenedFieldNames({
                            fields: tab.fields,
                            parentIsLocalized: parentIsLocalized || tab.localized,
                            prefix: fieldPrefix
                        })
                    ];
                }, [])
            ];
        }
        if (fieldAffectsData(field)) {
            return [
                ...fieldsToUse,
                {
                    name: `${fieldPrefix}${field.name}`,
                    localized: fieldShouldBeLocalized({
                        field,
                        parentIsLocalized
                    })
                }
            ];
        }
        return fieldsToUse;
    }, []);
};
/**
 * returns true if all the fields in a block are identical to the existing table
 */ export const validateExistingBlockIsIdentical = ({ block, localized, parentIsLocalized, table, tableLocales })=>{
    const fieldNames = getFlattenedFieldNames({
        fields: block.fields,
        parentIsLocalized: parentIsLocalized || localized
    });
    const missingField = // ensure every field from the config is in the matching table
    fieldNames.find(({ name, localized })=>{
        const fieldTable = localized && tableLocales ? tableLocales : table;
        return Object.keys(fieldTable.columns).indexOf(name) === -1;
    }) || // ensure every table column is matched for every field from the config
    Object.keys(table).find((fieldName)=>{
        if (![
            '_locale',
            '_order',
            '_parentID',
            '_path',
            '_uuid'
        ].includes(fieldName)) {
            return fieldNames.findIndex((field)=>field.name) === -1;
        }
    });
    if (missingField) {
        return false;
    }
    return Boolean(localized) === Boolean(table.columns._locale);
};
export const InternalBlockTableNameIndex = Symbol('InternalBlockTableNameIndex');
export const setInternalBlockIndex = (block, index)=>{
    block[InternalBlockTableNameIndex] = index;
};
export const resolveBlockTableName = (block, originalTableName)=>{
    if (!block[InternalBlockTableNameIndex]) {
        return originalTableName;
    }
    return `${originalTableName}_${block[InternalBlockTableNameIndex]}`;
};

//# sourceMappingURL=validateExistingBlockIsIdentical.js.map