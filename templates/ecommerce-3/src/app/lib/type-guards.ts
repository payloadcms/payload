export const isObject = (object: unknown): object is Record<string, unknown> => {
  return typeof object === 'object' && object !== null && !Array.isArray(object)
}
