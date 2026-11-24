const treeQueryKeys = new Set(['groupBy', 'page', 'preset', 'queryByGroup', 'search', 'where'])

export function getTreeURL({ currentURL }: { currentURL: string }): string {
  const url = new URL(currentURL)

  for (const key of [...url.searchParams.keys()]) {
    if (treeQueryKeys.has(key) || key.startsWith('where[') || key.startsWith('queryByGroup[')) {
      url.searchParams.delete(key)
    }
  }

  return url.toString()
}
