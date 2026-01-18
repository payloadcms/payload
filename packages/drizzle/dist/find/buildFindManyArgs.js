import { getSelectMode } from 'payload/shared';
import { traverseFields } from './traverseFields.js';
// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({ adapter, collectionSlug, depth, draftsEnabled, fields, joinQuery, joins = [], locale, select, tableName, versions })=>{
    const result = {
        extras: {},
        with: {}
    };
    if (select) {
        result.columns = {
            id: true
        };
    }
    const _locales = {
        columns: select ? {
            _locale: true
        } : {
            id: false,
            _parentID: false
        },
        extras: {},
        with: {}
    };
    const withTabledFields = select ? {} : {
        numbers: true,
        rels: true,
        texts: true
    };
    traverseFields({
        _locales,
        adapter,
        collectionSlug,
        currentArgs: result,
        currentTableName: tableName,
        depth,
        draftsEnabled,
        fields,
        joinQuery,
        joins,
        locale,
        path: '',
        select,
        selectMode: select ? getSelectMode(select) : undefined,
        tablePath: '',
        topLevelArgs: result,
        topLevelTableName: tableName,
        versions,
        withTabledFields
    });
    if (adapter.tables[`${tableName}_texts`] && withTabledFields.texts) {
        result.with._texts = {
            columns: {
                id: false,
                parent: false
            },
            orderBy: ({ order }, { asc: ASC })=>[
                    ASC(order)
                ]
        };
    }
    if (adapter.tables[`${tableName}_numbers`] && withTabledFields.numbers) {
        result.with._numbers = {
            columns: {
                id: false,
                parent: false
            },
            orderBy: ({ order }, { asc: ASC })=>[
                    ASC(order)
                ]
        };
    }
    if (adapter.tables[`${tableName}${adapter.relationshipsSuffix}`] && withTabledFields.rels) {
        result.with._rels = {
            columns: {
                id: false,
                parent: false
            },
            orderBy: ({ order }, { asc: ASC })=>[
                    ASC(order)
                ]
        };
    }
    if (adapter.tables[`${tableName}${adapter.localesSuffix}`] && (!select || Object.keys(_locales.columns).length > 1)) {
        result.with._locales = _locales;
    }
    // Delete properties that are empty
    for (const key of Object.keys(result)){
        if (!Object.keys(result[key]).length) {
            delete result[key];
        }
    }
    return result;
};

//# sourceMappingURL=buildFindManyArgs.js.map