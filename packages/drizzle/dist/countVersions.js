import { buildVersionCollectionFields } from 'payload';
import toSnakeCase from 'to-snake-case';
import { buildQuery } from './queries/buildQuery.js';
import { getTransaction } from './utilities/getTransaction.js';
export const countVersions = async function countVersions({ collection, locale, req, where: whereArg }) {
    const collectionConfig = this.payload.collections[collection].config;
    const tableName = this.tableNameMap.get(`_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`);
    const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true);
    const { joins, where } = buildQuery({
        adapter: this,
        fields,
        locale,
        tableName,
        where: whereArg
    });
    const db = await getTransaction(this, req);
    const countResult = await this.countDistinct({
        db,
        joins,
        tableName,
        where
    });
    return {
        totalDocs: countResult
    };
};

//# sourceMappingURL=countVersions.js.map