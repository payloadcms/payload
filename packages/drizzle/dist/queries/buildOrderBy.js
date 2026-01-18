import { asc, desc } from 'drizzle-orm';
import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js';
import { getTableColumnFromPath } from './getTableColumnFromPath.js';
/**
 * Gets the order by column and direction constructed from the sort argument adds the column to the select fields and joins if necessary
 */ export const buildOrderBy = ({ adapter, aliasTable, fields, joins, locale, parentIsLocalized, rawSort, selectFields, sort, tableName })=>{
    const orderBy = [];
    const createdAt = adapter.tables[tableName]?.createdAt;
    if (!sort) {
        if (createdAt) {
            sort = '-createdAt';
        } else {
            sort = '-id';
        }
    }
    if (typeof sort === 'string') {
        sort = [
            sort
        ];
    }
    // In the case of Mongo, when sorting by a field that is not unique, the results are not guaranteed to be in the same order each time.
    // So we add a fallback sort to ensure that the results are always in the same order.
    let fallbackSort = '-id';
    if (createdAt) {
        fallbackSort = '-createdAt';
    }
    if (!(sort.includes(fallbackSort) || sort.includes(fallbackSort.replace('-', '')))) {
        sort.push(fallbackSort);
    }
    for (const sortItem of sort){
        let sortProperty;
        let sortDirection;
        if (sortItem[0] === '-') {
            sortProperty = sortItem.substring(1);
            sortDirection = 'desc';
        } else {
            sortProperty = sortItem;
            sortDirection = 'asc';
        }
        try {
            const { columnName: sortTableColumnName, table: sortTable } = getTableColumnFromPath({
                adapter,
                collectionPath: sortProperty,
                fields,
                joins,
                locale,
                parentIsLocalized,
                pathSegments: sortProperty.replace(/__/g, '.').split('.'),
                selectFields,
                tableName,
                value: sortProperty
            });
            if (sortTable?.[sortTableColumnName]) {
                let order = sortDirection === 'asc' ? asc : desc;
                if (rawSort) {
                    order = ()=>rawSort;
                }
                orderBy.push({
                    column: aliasTable && tableName === getNameFromDrizzleTable(sortTable) ? aliasTable[sortTableColumnName] : sortTable[sortTableColumnName],
                    order
                });
                selectFields[sortTableColumnName] = sortTable[sortTableColumnName];
            }
        } catch (_) {
        // continue
        }
    }
    return orderBy;
};

//# sourceMappingURL=buildOrderBy.js.map