import { extendDrizzleTable } from './extendDrizzleTable.js';
export const executeSchemaHooks = async ({ type, adapter })=>{
    for (const hook of adapter[type]){
        const result = await hook({
            adapter: adapter,
            extendTable: extendDrizzleTable,
            schema: {
                enums: adapter.enums,
                relations: adapter.relations,
                tables: adapter.tables
            }
        });
        if (result.enums) {
            adapter.enums = result.enums;
        }
        adapter.tables = result.tables;
        adapter.relations = result.relations;
    }
};

//# sourceMappingURL=executeSchemaHooks.js.map