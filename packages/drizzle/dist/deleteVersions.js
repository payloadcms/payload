import { inArray } from 'drizzle-orm';
import { APIError, buildVersionCollectionFields, buildVersionGlobalFields } from 'payload';
import toSnakeCase from 'to-snake-case';
import { findMany } from './find/findMany.js';
import { getTransaction } from './utilities/getTransaction.js';
export const deleteVersions = async function deleteVersion({ collection: collectionSlug, globalSlug, locale, req, where: where }) {
    let tableName;
    let fields;
    if (globalSlug) {
        const globalConfig = this.payload.globals.config.find(({ slug })=>slug === globalSlug);
        tableName = this.tableNameMap.get(`_${toSnakeCase(globalSlug)}${this.versionsSuffix}`);
        fields = buildVersionGlobalFields(this.payload.config, globalConfig, true);
    } else if (collectionSlug) {
        const collectionConfig = this.payload.collections[collectionSlug].config;
        tableName = this.tableNameMap.get(`_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`);
        fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true);
    } else {
        throw new APIError('Either collection or globalSlug must be passed.');
    }
    const { docs } = await findMany({
        adapter: this,
        fields,
        joins: false,
        limit: 0,
        locale,
        page: 1,
        pagination: false,
        req,
        tableName,
        where
    });
    const ids = [];
    docs.forEach((doc)=>{
        ids.push(doc.id);
    });
    if (ids.length > 0) {
        const db = await getTransaction(this, req);
        await this.deleteWhere({
            db,
            tableName,
            where: inArray(this.tables[tableName].id, ids)
        });
    }
    return docs;
};

//# sourceMappingURL=deleteVersions.js.map