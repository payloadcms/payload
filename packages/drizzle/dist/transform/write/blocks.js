import { fieldShouldBeLocalized } from 'payload/shared';
import toSnakeCase from 'to-snake-case';
import { resolveBlockTableName } from '../../utilities/validateExistingBlockIsIdentical.js';
import { traverseFields } from './traverseFields.js';
export const transformBlocks = ({ adapter, baseTableName, blocks, blocksToDelete, data, field, locale, numbers, numbersToDelete, parentIsLocalized, path, relationships, relationshipsToDelete, selects, texts, textsToDelete, withinArrayOrBlockLocale })=>{
    data.forEach((blockRow, i)=>{
        if (typeof blockRow.blockType !== 'string') {
            return;
        }
        const matchedBlock = adapter.payload.blocks[blockRow.blockType] ?? (field.blockReferences ?? field.blocks).find((block)=>typeof block !== 'string' && block.slug === blockRow.blockType);
        if (!matchedBlock) {
            return;
        }
        const blockType = toSnakeCase(blockRow.blockType);
        const newRow = {
            arrays: {},
            arraysToPush: {},
            locales: {},
            row: {
                _order: i + 1,
                _path: `${path}${field.name}`
            }
        };
        if (fieldShouldBeLocalized({
            field,
            parentIsLocalized
        }) && locale) {
            newRow.row._locale = locale;
        }
        if (withinArrayOrBlockLocale) {
            newRow.row._locale = withinArrayOrBlockLocale;
        }
        const blockTableName = resolveBlockTableName(matchedBlock, adapter.tableNameMap.get(`${baseTableName}_blocks_${blockType}`));
        if (!blocks[blockTableName]) {
            blocks[blockTableName] = [];
        }
        const hasUUID = adapter.tables[blockTableName]._uuid;
        // If we have declared a _uuid field on arrays,
        // that means the ID has to be unique,
        // and our ids within arrays are not unique.
        // So move the ID to a uuid field for storage
        // and allow the database to generate a serial id automatically
        if (hasUUID) {
            newRow.row._uuid = blockRow.id;
            delete blockRow.id;
        }
        traverseFields({
            adapter,
            arrays: newRow.arrays,
            arraysToPush: newRow.arraysToPush,
            baseTableName,
            blocks,
            blocksToDelete,
            columnPrefix: '',
            data: blockRow,
            fieldPrefix: '',
            fields: matchedBlock.flattenedFields,
            insideArrayOrBlock: true,
            locales: newRow.locales,
            numbers,
            numbersToDelete,
            parentIsLocalized: parentIsLocalized || field.localized,
            parentTableName: blockTableName,
            path: `${path || ''}${field.name}.${i}.`,
            relationships,
            relationshipsToAppend: [],
            relationshipsToDelete,
            row: newRow.row,
            selects,
            texts,
            textsToDelete,
            withinArrayOrBlockLocale
        });
        blocks[blockTableName].push(newRow);
    });
};

//# sourceMappingURL=blocks.js.map