import { buildVersionCollectionFields } from 'payload';
import toSnakeCase from 'to-snake-case';
import { findMany } from './find/findMany.js';
export const findVersions = async function findVersions({ collection, limit, locale, page, pagination, req, select, sort: sortArg, where }) {
    const collectionConfig = this.payload.collections[collection].config;
    const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort;
    const tableName = this.tableNameMap.get(`_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`);
    const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true);
    return findMany({
        adapter: this,
        fields,
        joins: false,
        limit,
        locale,
        page,
        pagination,
        req,
        select,
        sort,
        tableName,
        where
    });
};

//# sourceMappingURL=findVersions.js.map