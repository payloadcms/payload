export type SchemaBuildContext<TSchema> = {
  clear: () => void
  getOrCreate: (args: {
    build: () => TSchema
    definition: object
    label: string
    variantKey: string
  }) => TSchema
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
    getOrCreate: ({ build, definition, variantKey }) => {
      const schemasByVariant = schemasByDefinition.get(definition)

      if (!isCacheEnabled) {
        return build()
      }

      if (schemasByVariant?.has(variantKey)) {
        return schemasByVariant.get(variantKey)!
      }

      const schema = build()
      const storedSchemasByVariant = schemasByVariant ?? new Map<string, TSchema>()

      storedSchemasByVariant.set(variantKey, schema)
      schemasByDefinition.set(definition, storedSchemasByVariant)

      return schema
    },
  }
}
