import type { JsonValue } from '../types/index.js';
export declare const deepCopyObject: <T>(o: T) => T;
/**
 * A deepCopyObject implementation which only works for JSON objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(obj))
 *
 * @param value The JSON value to be cloned. There are two invariants. 1) It must not contain circles
 *              as JSON does not allow it. This function will cause infinite loop for such values by
 *              design. 2) It must contain JSON values only. Other values like `Date`, `Regexp`, `Map`,
 *              `Set`, `Buffer`, ... are not allowed.
 * @returns The cloned JSON value.
 */
export declare function deepCopyObjectSimple<T extends JsonValue>(value: T, filterUndefined?: boolean): T;
export declare function deepCopyObjectSimpleWithoutReactComponents<T extends JsonValue>(value: T, opts?: {
    excludeFiles?: boolean;
}): T;
/**
 * A deepCopyObject implementation which is slower than deepCopyObject, but more correct.
 * Can be used if correctness is more important than speed. Supports circular dependencies
 */
export declare function deepCopyObjectComplex<T>(object: T, cache?: WeakMap<any, any>): T;
//# sourceMappingURL=deepCopyObject.d.ts.map