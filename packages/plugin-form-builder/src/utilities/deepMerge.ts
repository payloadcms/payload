export function isObject(item: unknown): boolean {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

export default function deepMerge<T, R>(target: T, source: R): T {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      // @ts-ignore
      if (isObject(source[key])) {
        if (!(key in target)) {
          // @ts-ignore
          Object.assign(output, { [key]: source[key] });
        } else {
          // @ts-ignore
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        // @ts-ignore
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}
