import { sql } from 'drizzle-orm';
import { foreignKey, index, integer, numeric, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';
const rawColumnBuilderMap = {
    integer,
    numeric,
    text
};
export const buildDrizzleTable = ({ adapter, locales, rawTable })=>{
    const columns = {};
    for (const [key, column] of Object.entries(rawTable.columns)){
        switch(column.type){
            case 'boolean':
                {
                    columns[key] = integer(column.name, {
                        mode: 'boolean'
                    });
                    break;
                }
            case 'enum':
                if ('locale' in column) {
                    columns[key] = text(column.name, {
                        enum: locales
                    });
                } else {
                    columns[key] = text(column.name, {
                        enum: column.options
                    });
                }
                break;
            case 'geometry':
            case 'jsonb':
                {
                    columns[key] = text(column.name, {
                        mode: 'json'
                    });
                    break;
                }
            case 'numeric':
                {
                    columns[key] = numeric(column.name, {
                        mode: 'number'
                    });
                    break;
                }
            case 'serial':
                {
                    columns[key] = integer(column.name);
                    break;
                }
            case 'timestamp':
                {
                    let builder = text(column.name);
                    if (column.defaultNow) {
                        builder = builder.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);
                    }
                    columns[key] = builder;
                    break;
                }
            case 'uuid':
                {
                    let builder = text(column.name, {
                        length: 36
                    });
                    if (column.defaultRandom) {
                        builder = builder.$defaultFn(()=>uuidv4());
                    }
                    columns[key] = builder;
                    break;
                }
            case 'varchar':
                {
                    columns[key] = text(column.name);
                    break;
                }
            default:
                columns[key] = rawColumnBuilderMap[column.type](column.name);
                break;
        }
        if (column.reference) {
            const ref = column.reference;
            columns[key].references(()=>adapter.tables[ref.table][ref.name], {
                onDelete: ref.onDelete
            });
        }
        if (column.primaryKey) {
            let args = undefined;
            if (column.type === 'integer' && column.autoIncrement) {
                args = {
                    autoIncrement: true
                };
            }
            columns[key].primaryKey(args);
        }
        if (column.notNull) {
            columns[key].notNull();
        }
        if (typeof column.default !== 'undefined') {
            let sanitizedDefault = column.default;
            if (column.type === 'geometry' && Array.isArray(column.default)) {
                sanitizedDefault = JSON.stringify({
                    type: 'Point',
                    coordinates: [
                        column.default[0],
                        column.default[1]
                    ]
                });
            }
            columns[key].default(sanitizedDefault);
        }
    }
    const extraConfig = (cols)=>{
        const config = {};
        if (rawTable.indexes) {
            for (const [key, rawIndex] of Object.entries(rawTable.indexes)){
                let fn = index;
                if (rawIndex.unique) {
                    fn = uniqueIndex;
                }
                if (Array.isArray(rawIndex.on)) {
                    if (rawIndex.on.length) {
                        config[key] = fn(rawIndex.name).on(...rawIndex.on.map((colName)=>cols[colName]));
                    }
                } else {
                    config[key] = fn(rawIndex.name).on(cols[rawIndex.on]);
                }
            }
        }
        if (rawTable.foreignKeys) {
            for (const [key, rawForeignKey] of Object.entries(rawTable.foreignKeys)){
                let builder = foreignKey({
                    name: rawForeignKey.name,
                    columns: rawForeignKey.columns.map((colName)=>cols[colName]),
                    foreignColumns: rawForeignKey.foreignColumns.map((column)=>adapter.tables[column.table][column.name])
                });
                if (rawForeignKey.onDelete) {
                    builder = builder.onDelete(rawForeignKey.onDelete);
                }
                if (rawForeignKey.onUpdate) {
                    builder = builder.onDelete(rawForeignKey.onUpdate);
                }
                config[key] = builder;
            }
        }
        return config;
    };
    adapter.tables[rawTable.name] = sqliteTable(rawTable.name, columns, extraConfig);
};

//# sourceMappingURL=buildDrizzleTable.js.map