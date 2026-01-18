import type { ObjMap } from 'graphql/jsutils/ObjMap.js';
import type { GraphQLFieldConfig } from 'graphql/type/definition.js';
import type { PayloadRequest } from 'payload';
type PayloadContext = {
    req: PayloadRequest;
};
export declare function wrapCustomFields<TSource>(fields: ObjMap<GraphQLFieldConfig<TSource, PayloadContext>>): ObjMap<GraphQLFieldConfig<TSource, PayloadContext>>;
export {};
//# sourceMappingURL=wrapCustomResolver.d.ts.map