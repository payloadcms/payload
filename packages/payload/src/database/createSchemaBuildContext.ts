export type SchemaBuildCacheEvent<TSchema> = {
  action: 'hit' | 'miss' | 'store'
  label: string
  schema?: TSchema
  variantKey: string
}

export type SchemaBuildContextSnapshot = {
  entries: Array<{
    hits: number
    label: string
    misses: number
    variantKey: string
  }>
  hits: number
  misses: number
}

export type SchemaBuildContext<TSchema> = {
  clear: () => void
  getOrCreate: (args: {
    build: () => TSchema
    definition: object
    label: string
    variantKey: string
  }) => TSchema
  snapshot: () => SchemaBuildContextSnapshot
}

type CacheEntryCounts = {
  hits: number
  misses: number
}

export const createSchemaBuildContext = <TSchema>({
  onEvent,
}: {
  onEvent?: (event: SchemaBuildCacheEvent<TSchema>) => void
} = {}): SchemaBuildContext<TSchema> => {
  let schemasByDefinition = new WeakMap<object, Map<string, TSchema>>()
  const countsByLabel = new Map<string, Map<string, CacheEntryCounts>>()
  let hits = 0
  let misses = 0

  return {
    clear: () => {
      schemasByDefinition = new WeakMap<object, Map<string, TSchema>>()
      countsByLabel.clear()
      hits = 0
      misses = 0
    },
    getOrCreate: ({ build, definition, label, variantKey }) => {
      const schemasByVariant = schemasByDefinition.get(definition)
      const counts = getCacheEntryCounts({ countsByLabel, label, variantKey })

      if (schemasByVariant?.has(variantKey)) {
        const schema = schemasByVariant.get(variantKey)!

        counts.hits += 1
        hits += 1
        onEvent?.({ action: 'hit', label, variantKey })

        return schema
      }

      counts.misses += 1
      misses += 1
      onEvent?.({ action: 'miss', label, variantKey })

      const schema = build()
      const storedSchemasByVariant = schemasByVariant ?? new Map<string, TSchema>()

      storedSchemasByVariant.set(variantKey, schema)
      schemasByDefinition.set(definition, storedSchemasByVariant)
      onEvent?.({ action: 'store', label, schema, variantKey })

      return schema
    },
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
