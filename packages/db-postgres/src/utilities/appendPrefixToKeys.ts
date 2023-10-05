export const appendPrefixToObjectKeys = <T>(obj: Record<string, unknown>, prefix: string): T =>
  Object.entries(obj).reduce((res, [key, val]) => {
    res[`${prefix}_${key}`] = val
    return res
  }, {} as T)
