import { fieldShouldBeLocalized } from 'payload/shared';
import { isArrayOfRows } from '../../utilities/isArrayOfRows.js';
import { traverseFields } from './traverseFields.js';
export const transformArray = ({ adapter, arrayTableName, baseTableName, blocks, blocksToDelete, data, field, locale, numbers, numbersToDelete, parentIsLocalized, path, relationships, relationshipsToDelete, selects, texts, textsToDelete, withinArrayOrBlockLocale })=>{
    const newRows = [];
    const hasUUID = adapter.tables[arrayTableName]._uuid;
    if (isArrayOfRows(data)) {
        data.forEach((arrayRow, i)=>{
            const newRow = {
                arrays: {},
                arraysToPush: {},
                locales: {},
                row: {
                    _order: i + 1
                }
            };
            // If we have declared a _uuid field on arrays,
            // that means the ID has to be unique,
            // and our ids within arrays are not unique.
            // So move the ID to a uuid field for storage
            // and allow the database to generate a serial id automatically
            if (hasUUID) {
                newRow.row._uuid = arrayRow.id;
                delete arrayRow.id;
            }
            if (locale) {
                newRow.locales[locale] = {
                    _locale: locale
                };
            }
            if (fieldShouldBeLocalized({
                field,
                parentIsLocalized
            }) && locale) {
                newRow.row._locale = locale;
            }
            if (withinArrayOrBlockLocale) {
                newRow.row._locale = withinArrayOrBlockLocale;
            }
            traverseFields({
                adapter,
                arrays: newRow.arrays,
                arraysToPush: newRow.arraysToPush,
                baseTableName,
                blocks,
                blocksToDelete,
                columnPrefix: '',
                data: arrayRow,
                fieldPrefix: '',
                fields: field.flattenedFields,
                insideArrayOrBlock: true,
                locales: newRow.locales,
                numbers,
                numbersToDelete,
                parentIsLocalized: parentIsLocalized || field.localized,
                parentTableName: arrayTableName,
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
            newRows.push(newRow);
        });
    }
    return newRows;
};

//# sourceMappingURL=array.js.map