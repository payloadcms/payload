/**
 * Allows for easy toggling between resolving promises sequentially vs in parallel
 */
export async function executePromises<T extends Array<() => Promise<any>>>(
  promiseFns: T,
  parallel: boolean,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  if (parallel) {
    // Parallel execution with Promise.all and maintain proper typing
    return Promise.all(promiseFns.map((promiseFn) => promiseFn())) as Promise<{
      [K in keyof T]: Awaited<ReturnType<T[K]>>
    }>
  } else {
    // Sequential execution while maintaining types
    const results: Awaited<ReturnType<T[number]>>[] = []
    for (const promiseFn of promiseFns) {
      results.push(await promiseFn())
    }
    return results as unknown as Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }>
  }
}
