import { buildVersionGlobalFields } from 'payload';
import toSnakeCase from 'to-snake-case';
import { buildQuery } from './queries/buildQuery.js';
import { upsertRow } from './upsertRow/index.js';
import { getTransaction } from './utilities/getTransaction.js';
export async function updateGlobalVersion({ id, global, locale, req, returning, select, versionData, where: whereArg }) {
    const globalConfig = this.payload.globals.config.find(({ slug })=>slug === global);
    const whereToUse = whereArg || {
        id: {
            equals: id
        }
    };
    const tableName = this.tableNameMap.get(`_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`);
    const fields = buildVersionGlobalFields(this.payload.config, globalConfig, true);
    const { where } = buildQuery({
        adapter: this,
        fields,
        locale,
        tableName,
        where: whereToUse
    });
    const db = await getTransaction(this, req);
    const result = await upsertRow({
        id,
        adapter: this,
        data: versionData,
        db,
        fields,
        globalSlug: global,
        ignoreResult: returning === false,
        operation: 'update',
        req,
        select,
        tableName,
        where
    });
    if (returning === false) {
        return null;
    }
    return result;
}

//# sourceMappingURL=updateGlobalVersion.js.map