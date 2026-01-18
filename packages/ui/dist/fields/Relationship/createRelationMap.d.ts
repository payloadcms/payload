import type { HasManyValueUnion } from './types.js';
type RelationMap = {
    [relation: string]: (number | string)[];
};
type CreateRelationMap = (args: {
    relationTo: string[];
} & HasManyValueUnion) => RelationMap;
export declare const createRelationMap: CreateRelationMap;
export {};
//# sourceMappingURL=createRelationMap.d.ts.map