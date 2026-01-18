import type { Field } from 'payload';
import { GraphQLInputObjectType } from 'graphql';
type Args = {
    fields: Field[];
    name: string;
    parentName: string;
};
/** This does as the function name suggests. It builds a where GraphQL input type
 * for all the fields which are passed to the function.
 * Each field has different operators which may be valid for a where input type.
 * For example, a text field may have a "contains" operator, but a number field
 * may not.
 *
 * buildWhereInputType is similar to buildObjectType and operates
 * on a field basis with a few distinct differences.
 *
 * 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
 * 2. Relationships, groups, repeaters and flex content are not
 *    directly searchable. Instead, we need to build a chained pathname
 *    using dot notation so MongoDB can properly search nested paths.
 */
export declare const buildWhereInputType: ({ name, fields, parentName }: Args) => GraphQLInputObjectType;
export {};
//# sourceMappingURL=buildWhereInputType.d.ts.map