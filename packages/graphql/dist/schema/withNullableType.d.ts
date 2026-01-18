import type { GraphQLType } from 'graphql';
import type { FieldAffectingData } from 'payload';
export declare const withNullableType: ({ type, field, forceNullable, parentIsLocalized, }: {
    field: FieldAffectingData;
    forceNullable?: boolean;
    parentIsLocalized: boolean;
    type: GraphQLType;
}) => GraphQLType;
//# sourceMappingURL=withNullableType.d.ts.map