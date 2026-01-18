import type { GraphQLResolveInfo } from 'graphql';
import type { TypedCollectionSelect } from 'payload';
export declare function buildSelectForCollection(info: GraphQLResolveInfo): SelectType;
export declare function buildSelectForCollectionMany(info: GraphQLResolveInfo): SelectType;
export declare function resolveSelect(info: GraphQLResolveInfo, select: SelectType): SelectType;
type SelectType = TypedCollectionSelect['any'];
export {};
//# sourceMappingURL=select.d.ts.map