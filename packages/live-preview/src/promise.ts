export const promise = async (args: {
  accessor: number | string
  apiRoute?: string
  cache?: Map<string, unknown>
  cacheKey?: string
  collection: string
  depth: number
  id: number | string
  ref: Record<string, unknown>
  serverURL: string
}): Promise<void> => {
  const { id, accessor, apiRoute, cache, cacheKey, collection, depth, ref, serverURL } = args

  const cachedValue = cache && cacheKey && cache.get(cacheKey)

  if (cachedValue) {
    ref[accessor] = cachedValue
    return
  }

  const url = `${serverURL}${apiRoute || '/api'}/${collection}/${id}?depth=${depth}`

  let doc: Record<string, unknown> | null | undefined = null

  try {
    doc = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json())
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
  }

  if (cache && cacheKey) {
    cache.set(cacheKey, doc)
  }

  ref[accessor] = doc
}
