import { sql } from 'drizzle-orm';
import { buildVersionGlobalFields } from 'payload';
import { hasDraftsEnabled } from 'payload/shared';
import toSnakeCase from 'to-snake-case';
import { upsertRow } from './upsertRow/index.js';
import { getTransaction } from './utilities/getTransaction.js';
export async function createGlobalVersion({ autosave, createdAt, globalSlug, publishedLocale, req, returning, select, snapshot, updatedAt, versionData }) {
    const global = this.payload.globals.config.find(({ slug })=>slug === globalSlug);
    const tableName = this.tableNameMap.get(`_${toSnakeCase(global.slug)}${this.versionsSuffix}`);
    const db = await getTransaction(this, req);
    const result = await upsertRow({
        adapter: this,
        data: {
            autosave,
            createdAt,
            latest: true,
            publishedLocale,
            snapshot,
            updatedAt,
            version: versionData
        },
        db,
        fields: buildVersionGlobalFields(this.payload.config, global, true),
        globalSlug,
        ignoreResult: returning === false ? 'idOnly' : false,
        operation: 'create',
        req,
        select,
        tableName
    });
    const table = this.tables[tableName];
    if (hasDraftsEnabled(global)) {
        await this.execute({
            db,
            sql: sql`
          UPDATE ${table}
          SET latest = false
          WHERE ${table.id} != ${result.id};
        `
        });
    }
    if (returning === false) {
        return null;
    }
    return result;
}

//# sourceMappingURL=createGlobalVersion.js.map