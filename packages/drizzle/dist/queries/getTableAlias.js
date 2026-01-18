import { alias } from 'drizzle-orm/pg-core';
import { alias as aliasSQLite } from 'drizzle-orm/sqlite-core/alias';
import toSnakeCase from 'to-snake-case';
import { v4 as uuid } from 'uuid';
export const getTableAlias = ({ adapter, tableName })=>{
    const newAliasTableName = toSnakeCase(uuid());
    let newAliasTable;
    if (adapter.name === 'postgres') {
        newAliasTable = alias(adapter.tables[tableName], newAliasTableName);
    }
    if (adapter.name === 'sqlite') {
        newAliasTable = aliasSQLite(adapter.tables[tableName], newAliasTableName);
    }
    return {
        newAliasTable,
        newAliasTableName
    };
};

//# sourceMappingURL=getTableAlias.js.map