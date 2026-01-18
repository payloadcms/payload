import { buildVersionCollectionFields, combineQueries } from 'payload';
import toSnakeCase from 'to-snake-case';
import { findMany } from './find/findMany.js';
export const queryDrafts = async function queryDrafts({ collection, joins, limit, locale, page = 1, pagination, req, select, sort, where }) {
    const collectionConfig = this.payload.collections[collection].config;
    const tableName = this.tableNameMap.get(`_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`);
    const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true);
    const combinedWhere = combineQueries({
        latest: {
            equals: true
        }
    }, where);
    const result = await findMany({
        adapter: this,
        collectionSlug: collection,
        fields,
        joins,
        limit,
        locale,
        page,
        pagination,
        req,
        select,
        sort,
        tableName,
        versions: true,
        where: combinedWhere
    });
    return {
        ...result,
        docs: result.docs.map((doc)=>{
            doc = {
                id: doc.parent,
                ...doc.version
            };
            return doc;
        })
    };
};

//# sourceMappingURL=queryDrafts.js.map