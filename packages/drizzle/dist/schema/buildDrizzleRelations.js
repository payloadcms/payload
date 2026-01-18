import { relations } from 'drizzle-orm';
export const buildDrizzleRelations = ({ adapter })=>{
    for(const tableName in adapter.rawRelations){
        const rawRelations = adapter.rawRelations[tableName];
        adapter.relations[`relations_${tableName}`] = relations(adapter.tables[tableName], ({ many, one })=>{
            const result = {};
            for(const key in rawRelations){
                const relation = rawRelations[key];
                if (relation.type === 'one') {
                    result[key] = one(adapter.tables[relation.to], {
                        fields: relation.fields.map((field)=>adapter.tables[field.table][field.name]),
                        references: relation.references.map((reference)=>adapter.tables[relation.to][reference]),
                        relationName: relation.relationName
                    });
                } else {
                    if (adapter.tables[relation.to]) {
                        result[key] = many(adapter.tables[relation.to], {
                            relationName: relation.relationName
                        });
                    }
                }
            }
            return result;
        });
    }
};

//# sourceMappingURL=buildDrizzleRelations.js.map