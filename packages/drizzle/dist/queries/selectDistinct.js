/**
 * Selects distinct records from a table only if there are joins that need to be used, otherwise return null
 */ export const selectDistinct = ({ adapter, db, forceRun, joins, query: queryModifier = ({ query })=>query, selectFields, tableName, where })=>{
    if (forceRun || Object.keys(joins).length > 0) {
        let query;
        const table = adapter.tables[tableName];
        if (adapter.name === 'postgres') {
            query = db.selectDistinct(selectFields).from(table).$dynamic();
        }
        if (adapter.name === 'sqlite') {
            query = db.selectDistinct(selectFields).from(table).$dynamic();
        }
        if (where) {
            query = query.where(where);
        }
        joins.forEach(({ type, condition, table })=>{
            query = query[type ?? 'leftJoin'](table, condition);
        });
        return queryModifier({
            query
        });
    }
};

//# sourceMappingURL=selectDistinct.js.map