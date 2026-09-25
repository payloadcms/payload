export type SchemaBuildContext<TSchema> = {
  clear: () => void
  getOrCreate: (args: { build: () => TSchema; cacheKey: string; definition: object }) => TSchema
}

export const createSchemaBuildContext = <TSchema>({
  isCacheEnabled = true,
}: {
  isCacheEnabled?: boolean
} = {}): SchemaBuildContext<TSchema> => {
  let schemasByDefinition = new WeakMap<object, Map<string, TSchema>>()

  return {
    clear: () => {
      schemasByDefinition = new WeakMap<object, Map<string, TSchema>>()
    },
    getOrCreate: ({ build, cacheKey, definition }) => {
      const schemasByKey = schemasByDefinition.get(definition)

      if (!isCacheEnabled) {
        return build()
      }

      if (schemasByKey?.has(cacheKey)) {
        return schemasByKey.get(cacheKey)!
      }

      const schema = build()
      const storedSchemasByKey = schemasByKey ?? new Map<string, TSchema>()

      storedSchemasByKey.set(cacheKey, schema)
      schemasByDefinition.set(definition, storedSchemasByKey)

      return schema
    },
  }
}
