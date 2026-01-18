import toSnakeCase from 'to-snake-case';
import { buildQuery } from './queries/buildQuery.js';
import { getTransaction } from './utilities/getTransaction.js';
export const count = async function count({ collection, locale, req, where: whereArg }) {
    const collectionConfig = this.payload.collections[collection].config;
    const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug));
    const { joins, where } = buildQuery({
        adapter: this,
        fields: collectionConfig.flattenedFields,
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

//# sourceMappingURL=count.js.map