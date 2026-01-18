import deepMerge from 'deepmerge';
export { deepMerge };
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are combined with the source object's arrays.
 */
export declare function deepMergeWithCombinedArrays<T extends object>(obj1: object, obj2: object, options?: deepMerge.Options): T;
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are replaced by the source object's arrays.
 */
export declare function deepMergeWithSourceArrays<T extends object>(obj1: object, obj2: object): T;
/**
 * Fully-featured deepMerge. Does not clone React components by default.
 */
export declare function deepMergeWithReactComponents<T extends object>(obj1: object, obj2: object): T;
//# sourceMappingURL=deepMerge.d.ts.map