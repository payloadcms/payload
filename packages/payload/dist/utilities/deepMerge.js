import deepMerge from 'deepmerge';
import { isPlainObject } from './isPlainObject.js';
export { deepMerge };
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are combined with the source object's arrays.
 */ export function deepMergeWithCombinedArrays(obj1, obj2, options = {}) {
    return deepMerge(obj1, obj2, {
        arrayMerge: (target, source, options)=>{
            const destination = target.slice();
            source.forEach((item, index)=>{
                if (typeof destination[index] === 'undefined') {
                    destination[index] = options?.cloneUnlessOtherwiseSpecified(item, options);
                } else if (options?.isMergeableObject(item)) {
                    destination[index] = deepMerge(target[index], item, options);
                } else if (target.indexOf(item) === -1) {
                    destination.push(item);
                }
            });
            return destination;
        },
        ...options
    });
}
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are replaced by the source object's arrays.
 */ export function deepMergeWithSourceArrays(obj1, obj2) {
    return deepMerge(obj1, obj2, {
        arrayMerge: (_, source)=>source
    });
}
/**
 * Fully-featured deepMerge. Does not clone React components by default.
 */ export function deepMergeWithReactComponents(obj1, obj2) {
    return deepMerge(obj1, obj2, {
        isMergeableObject: isPlainObject
    });
}

//# sourceMappingURL=deepMerge.js.map