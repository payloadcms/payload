// @ts-strict-ignore
export function getUniqueListBy<T>(arr: T[], key: string): T[] {
  return [...new Map(arr.map((item) => [item[key], item])).values()]
}
