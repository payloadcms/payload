import type { IndexDefinition, IndexOptions, Schema, SchemaType } from 'mongoose'

type DescribedPath = {
  childPaths?: string[]
  instance: string
}

export type MongooseSchemaDescriptor = {
  discriminators: string[]
  indexes: Array<{
    fields: IndexDefinition
    options: Record<string, unknown>
  }>
  label: string
  options: {
    _id?: boolean
    discriminatorKey?: string
    id?: boolean
    minimize?: boolean
    timestamps?: boolean | Record<string, unknown>
  }
  paths: Record<string, DescribedPath>
  reachableSchemaCount: number
  variantKey: string
}

export const countUniqueReachableSchemas = ({ schemas }: { schemas: Schema[] }): number => {
  const visitedSchemas = new WeakSet<Schema>()

  const visit = (currentSchema: Schema): number => {
    if (visitedSchemas.has(currentSchema)) {
      return 0
    }

    visitedSchemas.add(currentSchema)

    return (
      1 +
      Object.values(currentSchema.paths).reduce((count, path) => {
        const childSchema = getChildSchema({ path })
        const discriminatorSchemas = getDiscriminatorSchemas({ path })

        return (
          count +
          (childSchema ? visit(childSchema) : 0) +
          discriminatorSchemas.reduce(
            (discriminatorCount, discriminatorSchema) =>
              discriminatorCount + visit(discriminatorSchema),
            0,
          )
        )
      }, 0)
    )
  }

  return schemas.reduce((count, schema) => count + visit(schema), 0)
}

export const describeMongooseSchema = ({
  label,
  schema,
  variantKey,
}: {
  label: string
  schema: Schema
  variantKey: string
}): MongooseSchemaDescriptor => {
  const discriminators: string[] = []
  const paths: Record<string, DescribedPath> = {}
  const visitedSchemas = new WeakSet<Schema>()

  visitSchema({ discriminators, pathPrefix: '', paths, schema, visitedSchemas })

  return {
    discriminators: discriminators.sort(),
    indexes: schema.indexes().map(([fields, options]) => ({
      fields,
      options: normalizeIndexOptions({ options }),
    })),
    label,
    options: {
      _id: schema.options._id,
      id: schema.options.id,
      discriminatorKey: schema.options.discriminatorKey,
      minimize: schema.options.minimize,
      timestamps: normalizeValue(schema.options.timestamps) as
        | boolean
        | Record<string, unknown>
        | undefined,
    },
    paths: Object.fromEntries(
      Object.entries(paths).sort(([left], [right]) => left.localeCompare(right)),
    ),
    reachableSchemaCount: countUniqueReachableSchemas({ schemas: [schema] }),
    variantKey,
  }
}

const getChildSchema = ({ path }: { path: SchemaType }): Schema | undefined => {
  const pathWithSchema = path as {
    caster?: { schema?: Schema }
    schema?: Schema
  } & SchemaType

  return pathWithSchema.schema ?? pathWithSchema.caster?.schema
}

const getDiscriminatorSchemas = ({ path }: { path: SchemaType }): Schema[] => {
  const childSchema = getChildSchema({ path }) as
    | ({ discriminators?: Record<string, Schema> } & Schema)
    | undefined

  return Object.values(childSchema?.discriminators ?? {})
}

const normalizeIndexOptions = ({ options }: { options: IndexOptions }): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(options)
      .filter(([, value]) => typeof value !== 'function' && typeof value !== 'undefined')
      .map(([key, value]) => [key, normalizeValue(value)])
      .sort(([left], [right]) => left.localeCompare(right)),
  )

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => typeof nestedValue !== 'function')
        .map(([key, nestedValue]) => [key, normalizeValue(nestedValue)])
        .sort(([left], [right]) => left.localeCompare(right)),
    )
  }

  return value
}

const visitSchema = ({
  discriminators,
  pathPrefix,
  paths,
  schema,
  visitedSchemas,
}: {
  discriminators: string[]
  pathPrefix: string
  paths: Record<string, DescribedPath>
  schema: Schema
  visitedSchemas: WeakSet<Schema>
}): void => {
  if (visitedSchemas.has(schema)) {
    return
  }

  visitedSchemas.add(schema)

  for (const [pathName, path] of Object.entries(schema.paths)) {
    const fullPath = pathPrefix ? `${pathPrefix}.${pathName}` : pathName
    const childSchema = getChildSchema({ path })

    paths[fullPath] = {
      ...(childSchema ? { childPaths: Object.keys(childSchema.paths).sort() } : {}),
      instance: path.instance,
    }

    const pathDiscriminators = (
      childSchema as ({ discriminators?: Record<string, Schema> } & Schema) | undefined
    )?.discriminators

    for (const [discriminatorName, discriminatorSchema] of Object.entries(
      pathDiscriminators ?? {},
    )) {
      discriminators.push(`${fullPath}:${discriminatorName}`)
      visitSchema({
        discriminators,
        pathPrefix: `${fullPath}<${discriminatorName}>`,
        paths,
        schema: discriminatorSchema,
        visitedSchemas,
      })
    }

    if (childSchema) {
      visitSchema({
        discriminators,
        pathPrefix: fullPath,
        paths,
        schema: childSchema,
        visitedSchemas,
      })
    }
  }
}
