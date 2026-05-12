type Page<T> = {
  docs: T[]
  hasNextPage: boolean
  totalDocs: number
}

type BatchTransformArgs<T> = {
  batchSize: number
  fetcher: (args: { limit: number; page: number }) => Promise<Page<T>>
  transform: (doc: T) => Promise<void>
}

export async function batchTransform<T>({
  batchSize,
  fetcher,
  transform,
}: BatchTransformArgs<T>): Promise<void> {
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { docs, hasNextPage } = await fetcher({ limit: batchSize, page })
    for (const doc of docs) {
      await transform(doc)
    }
    hasMore = hasNextPage
    page++
  }
}
