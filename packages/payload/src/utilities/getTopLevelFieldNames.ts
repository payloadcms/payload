export const getTopLevelFieldNames = (data: object): Set<string> =>
  new Set(Object.keys(data).map((fieldPath) => fieldPath.split('.', 1)[0]!))
