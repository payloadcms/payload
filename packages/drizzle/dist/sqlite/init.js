import { buildDrizzleRelations } from '../schema/buildDrizzleRelations.js';
import { buildRawSchema } from '../schema/buildRawSchema.js';
import { executeSchemaHooks } from '../utilities/executeSchemaHooks.js';
import { buildDrizzleTable } from './schema/buildDrizzleTable.js';
import { setColumnID } from './schema/setColumnID.js';
export const init = async function init() {
    let locales;
    this.rawRelations = {};
    this.rawTables = {};
    if (this.payload.config.localization) {
        locales = this.payload.config.localization.locales.map(({ code })=>code);
    }
    const adapter = this;
    buildRawSchema({
        adapter,
        setColumnID
    });
    await executeSchemaHooks({
        type: 'beforeSchemaInit',
        adapter: this
    });
    for(const tableName in this.rawTables){
        buildDrizzleTable({
            adapter,
            locales,
            rawTable: this.rawTables[tableName]
        });
    }
    buildDrizzleRelations({
        adapter
    });
    await executeSchemaHooks({
        type: 'afterSchemaInit',
        adapter: this
    });
    this.schema = {
        ...this.tables,
        ...this.relations
    };
};

//# sourceMappingURL=init.js.map