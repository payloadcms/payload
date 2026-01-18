import { valueIsValueWithRelation } from 'payload/shared';
export const transformRelationship = ({ baseRow, data, field, relationships })=>{
    const relations = Array.isArray(data) ? data : [
        data
    ];
    relations.forEach((relation, i)=>{
        if (relation) {
            const relationRow = {
                ...baseRow
            };
            if ('hasMany' in field && field.hasMany) {
                relationRow.order = i + 1;
            }
            if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
                relationRow[`${relation.relationTo}ID`] = relation.value;
                relationships.push(relationRow);
            } else if (typeof field.relationTo === 'string') {
                relationRow[`${field.relationTo}ID`] = relation;
                if (relation) {
                    relationships.push(relationRow);
                }
            }
        }
    });
};

//# sourceMappingURL=relationships.js.map