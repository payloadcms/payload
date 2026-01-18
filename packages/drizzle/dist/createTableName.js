import { APIError } from 'payload';
import toSnakeCase from 'to-snake-case';
/**
 * Used to name database enums and tables
 * Returns the table or enum name for a given entity
 */ export const createTableName = ({ adapter, config: { name, slug }, config, parentTableName, prefix = '', target = 'dbName', throwValidationError = false, versions = false, versionsCustomName = false })=>{
    let customNameDefinition = config[target];
    let defaultTableName = `${prefix}${toSnakeCase(name ?? slug)}`;
    if (versions) {
        defaultTableName = `_${defaultTableName}${adapter.versionsSuffix}`;
    }
    let customTableNameResult;
    if (!customNameDefinition && target === 'enumName') {
        customNameDefinition = config['dbName'];
    }
    if (customNameDefinition) {
        customTableNameResult = typeof customNameDefinition === 'function' ? customNameDefinition({
            tableName: parentTableName
        }) : customNameDefinition;
        if (versionsCustomName) {
            customTableNameResult = `_${customTableNameResult}${adapter.versionsSuffix}`;
        }
    }
    const result = customTableNameResult || defaultTableName;
    adapter.tableNameMap.set(defaultTableName, result);
    if (!throwValidationError) {
        return result;
    }
    if (result.length > 63) {
        throw new APIError(`Exceeded max identifier length for table or enum name of 63 characters. Invalid name: ${result}.
Tip: You can use the dbName property to reduce the table name length.
      `);
    }
    return result;
};

//# sourceMappingURL=createTableName.js.map