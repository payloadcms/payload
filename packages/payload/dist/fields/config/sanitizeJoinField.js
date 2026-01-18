import { APIError } from '../../errors/index.js';
import { InvalidFieldJoin } from '../../errors/InvalidFieldJoin.js';
import { flattenAllFields } from '../../utilities/flattenAllFields.js';
import { getFieldByPath } from '../../utilities/getFieldByPath.js';
export const sanitizeJoinField = ({ config, field, joinPath, joins, parentIsLocalized, polymorphicJoins, validateOnly })=>{
    // the `joins` arg is not passed for globals or when recursing on fields that do not allow a join field
    if (typeof joins === 'undefined') {
        throw new APIError('Join fields cannot be added to arrays, blocks or globals.');
    }
    if (typeof field.maxDepth === 'undefined') {
        field.maxDepth = 1;
    }
    const join = {
        field,
        joinPath: `${joinPath ? joinPath + '.' : ''}${field.name}`,
        parentIsLocalized,
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        targetField: undefined
    };
    if (Array.isArray(field.collection)) {
        for (const collection of field.collection){
            const sanitizedField = {
                ...field,
                collection
            };
            sanitizeJoinField({
                config,
                field: sanitizedField,
                joinPath,
                joins,
                parentIsLocalized,
                polymorphicJoins,
                validateOnly: true
            });
        }
        if (Array.isArray(polymorphicJoins)) {
            polymorphicJoins.push(join);
        }
        return;
    }
    const joinCollection = config.collections?.find((collection)=>collection.slug === field.collection);
    if (!joinCollection) {
        throw new InvalidFieldJoin(field);
    }
    const relationshipField = getFieldByPath({
        fields: flattenAllFields({
            cache: true,
            fields: joinCollection.fields
        }),
        path: field.on
    });
    if (!relationshipField || relationshipField.field.type !== 'relationship' && relationshipField.field.type !== 'upload') {
        throw new InvalidFieldJoin(join.field);
    }
    if (relationshipField.pathHasLocalized) {
        join.getForeignPath = ({ locale })=>{
            return relationshipField.localizedPath.replace('<locale>', locale);
        };
    }
    if (!relationshipField.field.index && !relationshipField.field.unique) {
        relationshipField.field.index = true;
    }
    if (validateOnly) {
        return;
    }
    join.targetField = relationshipField.field;
    // override the join field localized property to use whatever the relationship field has
    // or if it's nested to a localized array / blocks / tabs / group
    field.localized = relationshipField.field.localized;
    // override the join field hasMany property to use whatever the relationship field has
    field.hasMany = relationshipField.field.hasMany;
    // @ts-expect-error converting JoinField to FlattenedJoinField to track targetField
    field.targetField = join.targetField;
    if (!joins[field.collection]) {
        joins[field.collection] = [
            join
        ];
    } else {
        joins[field.collection]?.push(join);
    }
};

//# sourceMappingURL=sanitizeJoinField.js.map