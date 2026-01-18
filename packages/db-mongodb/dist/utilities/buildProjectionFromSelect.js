import { deepCopyObjectSimple, fieldAffectsData, fieldShouldBeLocalized, getSelectMode } from 'payload/shared';
const addFieldToProjection = ({ adapter, databaseSchemaPath, field, parentIsLocalized, projection })=>{
    const { config } = adapter.payload;
    if (parentIsLocalized && config.localization) {
        for (const locale of config.localization.localeCodes){
            const localeDatabaseSchemaPath = databaseSchemaPath.replace('<locale>', locale);
            projection[`${localeDatabaseSchemaPath}${field.name}`] = true;
        }
    } else {
        projection[`${databaseSchemaPath}${field.name}`] = true;
    }
};
const traverseFields = ({ adapter, databaseSchemaPath = '', fields, parentIsLocalized = false, projection, select, selectAllOnCurrentLevel = false, selectMode })=>{
    for (const field of fields){
        if (fieldAffectsData(field)) {
            if (selectMode === 'include') {
                if (select[field.name] === true || selectAllOnCurrentLevel) {
                    addFieldToProjection({
                        adapter,
                        databaseSchemaPath,
                        field,
                        parentIsLocalized,
                        projection
                    });
                    continue;
                }
                if (!select[field.name]) {
                    continue;
                }
            }
            if (selectMode === 'exclude') {
                if (typeof select[field.name] === 'undefined') {
                    addFieldToProjection({
                        adapter,
                        databaseSchemaPath,
                        field,
                        parentIsLocalized,
                        projection
                    });
                    continue;
                }
                if (select[field.name] === false) {
                    continue;
                }
            }
        }
        let fieldDatabaseSchemaPath = databaseSchemaPath;
        if (fieldAffectsData(field)) {
            fieldDatabaseSchemaPath = `${databaseSchemaPath}${field.name}.`;
            if (fieldShouldBeLocalized({
                field,
                parentIsLocalized
            })) {
                fieldDatabaseSchemaPath = `${fieldDatabaseSchemaPath}<locale>.`;
            }
        }
        switch(field.type){
            case 'array':
            case 'group':
            case 'tab':
                {
                    const fieldSelect = select[field.name];
                    if (field.type === 'array' && selectMode === 'include') {
                        fieldSelect.id = true;
                    }
                    traverseFields({
                        adapter,
                        databaseSchemaPath: fieldDatabaseSchemaPath,
                        fields: field.flattenedFields,
                        parentIsLocalized: parentIsLocalized || field.localized,
                        projection,
                        select: fieldSelect,
                        selectMode
                    });
                    break;
                }
            case 'blocks':
                {
                    const blocksSelect = select[field.name];
                    for (const _block of field.blockReferences ?? field.blocks){
                        const block = typeof _block === 'string' ? adapter.payload.blocks[_block] : _block;
                        if (!block) {
                            continue;
                        }
                        if (selectMode === 'include' && blocksSelect[block.slug] === true || selectMode === 'exclude' && typeof blocksSelect[block.slug] === 'undefined') {
                            traverseFields({
                                adapter,
                                databaseSchemaPath: fieldDatabaseSchemaPath,
                                fields: block.flattenedFields,
                                parentIsLocalized: parentIsLocalized || field.localized,
                                projection,
                                select: {},
                                selectAllOnCurrentLevel: true,
                                selectMode: 'include'
                            });
                            continue;
                        }
                        let blockSelectMode = selectMode;
                        if (selectMode === 'exclude' && blocksSelect[block.slug] === false) {
                            blockSelectMode = 'include';
                        }
                        if (typeof blocksSelect[block.slug] !== 'object') {
                            blocksSelect[block.slug] = {};
                        }
                        if (blockSelectMode === 'include' && typeof blocksSelect[block.slug] === 'object') {
                            const blockSelect = blocksSelect[block.slug];
                            blockSelect.id = true;
                            blockSelect.blockType = true;
                        }
                        traverseFields({
                            adapter,
                            databaseSchemaPath: fieldDatabaseSchemaPath,
                            fields: block.flattenedFields,
                            parentIsLocalized: parentIsLocalized || field.localized,
                            projection,
                            select: blocksSelect[block.slug],
                            selectMode: blockSelectMode
                        });
                    }
                    break;
                }
            default:
                break;
        }
    }
};
export const buildProjectionFromSelect = ({ adapter, fields, select })=>{
    if (!select) {
        return;
    }
    const projection = {
        _id: true
    };
    traverseFields({
        adapter,
        fields,
        projection,
        // Clone to safely mutate it later
        select: deepCopyObjectSimple(select),
        selectMode: getSelectMode(select)
    });
    return projection;
};

//# sourceMappingURL=buildProjectionFromSelect.js.map