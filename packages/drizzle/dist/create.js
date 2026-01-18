import toSnakeCase from 'to-snake-case';
import { upsertRow } from './upsertRow/index.js';
import { getTransaction } from './utilities/getTransaction.js';
export const create = async function create({ collection: collectionSlug, data, req, returning, select }) {
    const collection = this.payload.collections[collectionSlug].config;
    const tableName = this.tableNameMap.get(toSnakeCase(collection.slug));
    const db = await getTransaction(this, req);
    const result = await upsertRow({
        adapter: this,
        collectionSlug,
        data,
        db,
        fields: collection.flattenedFields,
        ignoreResult: returning === false,
        operation: 'create',
        req,
        select,
        tableName
    });
    if (returning === false) {
        return null;
    }
    return result;
};

//# sourceMappingURL=create.js.map