import toSnakeCase from 'to-snake-case';
import { upsertRow } from './upsertRow/index.js';
import { getTransaction } from './utilities/getTransaction.js';
export async function updateGlobal({ slug, data, req, returning, select }) {
    const globalConfig = this.payload.globals.config.find((config)=>config.slug === slug);
    const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug));
    const db = await getTransaction(this, req);
    const existingGlobal = await db.query[tableName].findFirst({});
    const result = await upsertRow({
        ...existingGlobal ? {
            id: existingGlobal.id,
            operation: 'update'
        } : {
            operation: 'create'
        },
        adapter: this,
        data,
        db,
        fields: globalConfig.flattenedFields,
        globalSlug: slug,
        ignoreResult: returning === false,
        req,
        select,
        tableName
    });
    if (returning === false) {
        return null;
    }
    result.globalType = slug;
    return result;
}

//# sourceMappingURL=updateGlobal.js.map