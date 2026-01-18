import { buildVersionGlobalFields } from 'payload';
import toSnakeCase from 'to-snake-case';
import { buildQuery } from './queries/buildQuery.js';
import { getTransaction } from './utilities/getTransaction.js';
export const countGlobalVersions = async function countGlobalVersions({ global, locale, req, where: whereArg }) {
    const globalConfig = this.payload.globals.config.find(({ slug })=>slug === global);
    const tableName = this.tableNameMap.get(`_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`);
    const fields = buildVersionGlobalFields(this.payload.config, globalConfig, true);
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

//# sourceMappingURL=countGlobalVersions.js.map