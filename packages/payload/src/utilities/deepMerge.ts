// @ts-strict-ignore
import deepMerge from 'deepmerge'

import { isPlainObject } from './isPlainObject.js'

export { deepMerge }
/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are combined with the source object's arrays.
 */
export function deepMergeWithCombinedArrays<T extends object>(
  obj1: object,
  obj2: object,
  options: deepMerge.Options = {},
): T {
  return deepMerge<T>(obj1, obj2, {
    arrayMerge: (target, source, options) => {
      const destination = target.slice()

      source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
          destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
        } else if (options.isMergeableObject(item)) {
          destination[index] = deepMerge(target[index], item, options)
        } else if (target.indexOf(item) === -1) {
          destination.push(item)
        }
      })
      return destination
    },
    ...options,
  })
}

/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are replaced by the source object's arrays.
 */
export function deepMergeWithSourceArrays<T extends object>(obj1: object, obj2: object): T {
  return deepMerge<T>(obj1, obj2, { arrayMerge: (_, source) => source })
}

/**
 * Fully-featured deepMerge. Does not clone React components by default.
 */
export function deepMergeWithReactComponents<T extends object>(obj1: object, obj2: object): T {
  return deepMerge<T>(obj1, obj2, {
    isMergeableObject: isPlainObject,
  })
}
