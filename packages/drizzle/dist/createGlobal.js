import toSnakeCase from 'to-snake-case';
import { upsertRow } from './upsertRow/index.js';
import { getTransaction } from './utilities/getTransaction.js';
export async function createGlobal({ slug, data, req, returning }) {
    const globalConfig = this.payload.globals.config.find((config)=>config.slug === slug);
    const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug));
    data.createdAt = new Date().toISOString();
    const db = await getTransaction(this, req);
    const result = await upsertRow({
        adapter: this,
        data,
        db,
        fields: globalConfig.flattenedFields,
        globalSlug: slug,
        ignoreResult: returning === false,
        operation: 'create',
        req,
        tableName
    });
    if (returning === false) {
        return null;
    }
    result.globalType = slug;
    return result;
}

//# sourceMappingURL=createGlobal.js.map