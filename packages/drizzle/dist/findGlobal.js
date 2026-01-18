import toSnakeCase from 'to-snake-case';
import { findMany } from './find/findMany.js';
export const findGlobal = async function findGlobal({ slug, locale, req, select, where }) {
    const globalConfig = this.payload.globals.config.find((config)=>config.slug === slug);
    const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug));
    const { docs: [doc] } = await findMany({
        adapter: this,
        fields: globalConfig.flattenedFields,
        limit: 1,
        locale,
        pagination: false,
        req,
        select,
        tableName,
        where
    });
    if (doc) {
        doc.globalType = slug;
        return doc;
    }
    return {};
};

//# sourceMappingURL=findGlobal.js.map