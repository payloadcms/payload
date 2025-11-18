// Mock for @payloadcms/translations/utilities
// This provides a simple mock for deepMergeSimple to resolve import issues in Storybook

export function deepMergeSimple<T = object>(obj1: object, obj2: object): T {
  const output = { ...obj1 }

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      // @ts-expect-error - simple mock implementation
      if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key]) && obj1[key]) {
        // @ts-expect-error - simple mock implementation
        output[key] = deepMergeSimple(obj1[key], obj2[key])
      } else {
        // @ts-expect-error - simple mock implementation
        output[key] = obj2[key]
      }
    }
  }

  return output as T
}