export async function mapAsync<T, U>(
  arr: T[],
  callbackfn: (item: T, index: number, array: T[]) => Promise<U>,
): Promise<U[]> {
  return Promise.all(arr.map(callbackfn))
}
