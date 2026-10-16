const DEFAULT_CONCURRENCY = 4

/**
 * Runs `mapper` over every item, at most `concurrency` items in flight at
 * once. Results preserve `items`' order regardless of completion order —
 * used so configured image sizes keep their declared metadata order.
 */
export async function mapWithBoundedConcurrency<TItem, TResult>(
  items: TItem[],
  mapper: (item: TItem, index: number) => Promise<TResult>,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length)
  let nextIndex = 0

  async function runWorker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1

      if (currentIndex >= items.length) {
        return
      }

      results[currentIndex] = await mapper(items[currentIndex]!, currentIndex)
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))

  return results
}
