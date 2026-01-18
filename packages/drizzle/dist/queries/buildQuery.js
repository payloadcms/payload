import { buildOrderBy } from './buildOrderBy.js';
import { parseParams } from './parseParams.js';
export const buildQuery = function buildQuery({ adapter, aliasTable, fields, joins = [], locale, parentIsLocalized, selectLocale, sort, tableName, where: incomingWhere }) {
    const selectFields = {
        id: adapter.tables[tableName].id
    };
    let where;
    const context = {
        sort
    };
    if (incomingWhere && Object.keys(incomingWhere).length > 0) {
        where = parseParams({
            adapter,
            aliasTable,
            context,
            fields,
            joins,
            locale,
            parentIsLocalized,
            selectFields,
            selectLocale,
            tableName,
            where: incomingWhere
        });
    }
    const orderBy = buildOrderBy({
        adapter,
        aliasTable,
        fields,
        joins,
        locale,
        parentIsLocalized,
        rawSort: context.rawSort,
        selectFields,
        sort: context.sort,
        tableName
    });
    return {
        joins,
        orderBy,
        selectFields,
        where
    };
};

//# sourceMappingURL=buildQuery.js.map