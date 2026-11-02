import { isPlainObject } from './isPlainObject.js'

export type DeepMergeArrayMergeOptions = {
  cloneUnlessOtherwiseSpecified: (value: unknown, options?: DeepMergeOptions) => any
  isMergeableObject: (value: unknown) => boolean
}

export type DeepMergeOptions = {
  /**
   * Merges two arrays. Defaults to concatenating `target` and `source`.
   */
  arrayMerge?: (target: any[], source: any[], options: ResolvedDeepMergeOptions) => any[]
  /**
   * When `false`, mergeable values are copied by reference instead of being deeply cloned.
   * @default true
   */
  clone?: boolean
  /**
   * Returns a custom merge function for a given key, or `undefined` to use the default merge.
   */
  customMerge?: (key: string, options?: DeepMergeOptions) => ((x: any, y: any) => any) | undefined
  /**
   * Determines whether a value should be merged recursively or copied as-is.
   */
  isMergeableObject?: (value: unknown) => boolean
}

type ResolvedDeepMergeOptions = {
  arrayMerge: NonNullable<DeepMergeOptions['arrayMerge']>
  isMergeableObject: NonNullable<DeepMergeOptions['isMergeableObject']>
} & DeepMergeArrayMergeOptions &
  DeepMergeOptions

const REACT_ELEMENT_TYPE = Symbol.for('react.element')

/**
 * Fully-featured deepMerge. Returns a new object and does not mutate its arguments.
 *
 * Array handling: arrays are concatenated unless `arrayMerge` is provided.
 *
 * `__proto__` keys are never copied to the result, preventing prototype poisoning of the returned
 * object when merging untrusted input (e.g. parsed JSON).
 */
export function deepMerge<T>(x: Partial<T>, y: Partial<T>, options?: DeepMergeOptions): T
export function deepMerge<T1, T2>(
  x: Partial<T1>,
  y: Partial<T2>,
  options?: DeepMergeOptions,
): T1 & T2
export function deepMerge(target: any, source: any, options?: DeepMergeOptions): any {
  const resolvedOptions = (options ?? {}) as ResolvedDeepMergeOptions

  resolvedOptions.arrayMerge = resolvedOptions.arrayMerge || defaultArrayMerge
  resolvedOptions.isMergeableObject = resolvedOptions.isMergeableObject || isMergeableObject
  // Exposed on `options` so that custom `arrayMerge` implementations can use it.
  resolvedOptions.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified as any

  const isSourceArray = Array.isArray(source)
  const isTargetArray = Array.isArray(target)

  if (isSourceArray !== isTargetArray) {
    return cloneUnlessOtherwiseSpecified(source, resolvedOptions)
  }

  if (isSourceArray) {
    return resolvedOptions.arrayMerge(target, source, resolvedOptions)
  }

  return mergeObject(target, source, resolvedOptions)
}

/**
 * Keeps the `deepMerge.Options` / `deepMerge.ArrayMergeOptions` type references from the former
 * `deepmerge` dependency working.
 */
// oxlint-disable-next-line typescript/no-namespace
export declare namespace deepMerge {
  type ArrayMergeOptions = DeepMergeArrayMergeOptions
  type Options = DeepMergeOptions
}

/**
 * Deep-merges all objects in the array, from left to right.
 */
deepMerge.all = function deepMergeAll<T = object>(
  objects: Partial<T>[],
  options?: DeepMergeOptions,
): T {
  if (!Array.isArray(objects)) {
    throw new Error('first argument should be an array')
  }

  return objects.reduce<any>((previous, next) => deepMerge(previous, next, options), {}) as T
}

/**
 * Fully-featured deepMerge.
 *
 * Array handling: Arrays in the target object are combined with the source object's arrays.
 */
export function deepMergeWithCombinedArrays<T extends object>(
  obj1: object,
  obj2: object,
  options: DeepMergeOptions = {},
): T {
  return deepMerge<T>(obj1, obj2, {
    arrayMerge: (target, source, options) => {
      const destination = target.slice()

      source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
          destination[index] = options?.cloneUnlessOtherwiseSpecified(item, options)
        } else if (options?.isMergeableObject(item)) {
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
 * Deep-merges objects while replacing arrays and retaining target values when the source contains
 * `undefined`. This matches partial update semantics, where `undefined` means that a stored value
 * was omitted rather than cleared.
 */
export function deepMergeWithSourceArraysIgnoringUndefined<T extends object>(
  obj1: object,
  obj2: object,
): T {
  return deepMergeWithSourceArrays<T>(obj1, removeUndefinedProperties(obj2))
}

/**
 * Fully-featured deepMerge. Does not clone React components by default.
 */
export function deepMergeWithReactComponents<T extends object>(obj1: object, obj2: object): T {
  return deepMerge<T>(obj1, obj2, {
    isMergeableObject: isPlainObject,
  })
}

function isMergeableObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const stringTag = Object.prototype.toString.call(value)

  if (stringTag === '[object RegExp]' || stringTag === '[object Date]') {
    return false
  }

  return (value as { $$typeof?: unknown }).$$typeof !== REACT_ELEMENT_TYPE
}

function cloneUnlessOtherwiseSpecified(value: unknown, options: ResolvedDeepMergeOptions): any {
  return options.clone !== false && options.isMergeableObject(value)
    ? deepMerge<object>(Array.isArray(value) ? [] : {}, value as object, options)
    : value
}

function defaultArrayMerge(target: any[], source: any[], options: ResolvedDeepMergeOptions) {
  return target.concat(source).map((element) => cloneUnlessOtherwiseSpecified(element, options))
}

function getMergeFunction(key: PropertyKey, options: ResolvedDeepMergeOptions) {
  if (!options.customMerge) {
    return deepMerge
  }

  const customMerge = options.customMerge(key as string, options)

  return typeof customMerge === 'function' ? customMerge : deepMerge
}

function getEnumerableOwnKeys(value: object): PropertyKey[] {
  return [
    ...Object.keys(value),
    ...Object.getOwnPropertySymbols(value).filter((symbol) =>
      Object.prototype.propertyIsEnumerable.call(value, symbol),
    ),
  ]
}

function isPropertyOnObject(object: object, property: PropertyKey): boolean {
  try {
    return property in object
  } catch {
    return false
  }
}

/**
 * A key is unsafe to merge when it exists on the target but is inherited or non-enumerable, or when
 * it is `__proto__`, which would replace the prototype of the returned object on assignment.
 */
function isUnsafeKey(target: object, key: PropertyKey): boolean {
  if (key === '__proto__') {
    return true
  }

  return (
    isPropertyOnObject(target, key) &&
    !(
      Object.prototype.hasOwnProperty.call(target, key) &&
      Object.prototype.propertyIsEnumerable.call(target, key)
    )
  )
}

function mergeObject(target: any, source: any, options: ResolvedDeepMergeOptions) {
  const destination: Record<PropertyKey, unknown> = {}

  if (options.isMergeableObject(target)) {
    for (const key of getEnumerableOwnKeys(target)) {
      if (key === '__proto__') {
        continue
      }

      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options)
    }
  }

  for (const key of getEnumerableOwnKeys(source)) {
    if (isUnsafeKey(target, key)) {
      continue
    }

    if (isPropertyOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options)
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options)
    }
  }

  return destination
}

function removeUndefinedProperties<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedProperties) as T
  }

  if (
    value === null ||
    typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .map(([key, nestedValue]) => [key, removeUndefinedProperties(nestedValue)]),
  ) as T
}
