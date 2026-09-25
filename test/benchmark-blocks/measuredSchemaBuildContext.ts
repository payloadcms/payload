import type { SchemaBuildContext } from 'payload/internal'

import { createSchemaBuildContext } from 'payload/internal'

export type SchemaBuildCacheSnapshot = {
  entries: Array<{
    hits: number
    label: string
    misses: number
    variantKey: string
  }>
  hits: number
  misses: number
}

type CacheEntryCounts = {
  hits: number
  misses: number
}

export const createMeasuredSchemaBuildContext = <TSchema>({
  onStore,
}: {
  onStore?: (args: { label: string; schema: TSchema; variantKey: string }) => void
} = {}): {
  context: SchemaBuildContext<TSchema>
  snapshot: () => SchemaBuildCacheSnapshot
} => {
  const cacheContext = createSchemaBuildContext<TSchema>()
  const countsByLabel = new Map<string, Map<string, CacheEntryCounts>>()
  let hits = 0
  let misses = 0

  const context: SchemaBuildContext<TSchema> = {
    clear: () => {
      cacheContext.clear()
      countsByLabel.clear()
      hits = 0
      misses = 0
    },
    getOrCreate: (args) => {
      let isBuilt = false
      const [label, ...settings] = args.cacheKey.split('|')
      const variantKey = settings.join('|') || 'default'
      const schema = cacheContext.getOrCreate({
        ...args,
        build: () => {
          isBuilt = true
          return args.build()
        },
      })
      const counts = getCacheEntryCounts({
        countsByLabel,
        label,
        variantKey,
      })

      if (isBuilt) {
        counts.misses += 1
        misses += 1
        onStore?.({ label, schema, variantKey })
      } else {
        counts.hits += 1
        hits += 1
      }

      return schema
    },
  }

  return {
    context,
    snapshot: () => ({
      entries: [...countsByLabel.entries()]
        .flatMap(([label, countsByVariant]) =>
          [...countsByVariant.entries()].map(([variantKey, counts]) => ({
            hits: counts.hits,
            label,
            misses: counts.misses,
            variantKey,
          })),
        )
        .sort((left, right) =>
          left.label === right.label
            ? left.variantKey.localeCompare(right.variantKey)
            : left.label.localeCompare(right.label),
        ),
      hits,
      misses,
    }),
  }
}

const getCacheEntryCounts = ({
  countsByLabel,
  label,
  variantKey,
}: {
  countsByLabel: Map<string, Map<string, CacheEntryCounts>>
  label: string
  variantKey: string
}): CacheEntryCounts => {
  let countsByVariant = countsByLabel.get(label)

  if (!countsByVariant) {
    countsByVariant = new Map<string, CacheEntryCounts>()
    countsByLabel.set(label, countsByVariant)
  }

  let counts = countsByVariant.get(variantKey)

  if (!counts) {
    counts = { hits: 0, misses: 0 }
    countsByVariant.set(variantKey, counts)
  }

  return counts
}
