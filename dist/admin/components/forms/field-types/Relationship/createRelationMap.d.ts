import { Value } from './types';
type RelationMap = {
    [relation: string]: (string | number)[];
};
type CreateRelationMap = (args: {
    hasMany: boolean;
    relationTo: string | string[];
    value: Value | Value[] | null;
}) => RelationMap;
export declare const createRelationMap: CreateRelationMap;
export {};
