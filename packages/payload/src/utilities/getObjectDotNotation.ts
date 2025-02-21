// @ts-strict-ignore
export const getObjectDotNotation = <T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T,
): T => {
  if (!path || !obj) {
    return defaultValue
  }
  const result = path.split('.').reduce((o, i) => o?.[i], obj)
  return result === undefined ? defaultValue : (result as T)
}
