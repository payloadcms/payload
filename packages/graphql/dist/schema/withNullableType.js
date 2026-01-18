import { GraphQLNonNull } from 'graphql';
export const withNullableType = ({ type, field, forceNullable, parentIsLocalized })=>{
    const hasReadAccessControl = field.access && field.access.read;
    const condition = field.admin && field.admin.condition;
    const isTimestamp = field.name === 'createdAt' || field.name === 'updatedAt';
    if (!forceNullable && 'required' in field && field.required && (!field.localized || parentIsLocalized) && !condition && !hasReadAccessControl && !isTimestamp) {
        return new GraphQLNonNull(type);
    }
    return type;
};

//# sourceMappingURL=withNullableType.js.map