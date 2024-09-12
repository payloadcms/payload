import type { DrizzleAdapter } from '../types.js'

type DatabaseSchema = {
  enums?: DrizzleAdapter['enums']
  relations: Record<string, any>
  tables: DrizzleAdapter['tables']
}

type Adapter = {
  afterSchemaInit: DatabaseSchemaTransform[]
  beforeSchemaInit: DatabaseSchemaTransform[]
} & DatabaseSchema

type DatabaseSchemaTransform = (
  schema: DatabaseSchema,
  adapter: Record<string, unknown>,
) => DatabaseSchema | Promise<DatabaseSchema>

export const executeSchemaHooks = async (
  adapter: Adapter,
  type: 'afterSchemaInit' | 'beforeSchemaInit',
) => {
  for (const hook of adapter[type]) {
    const result = await hook(
      {
        enums: adapter.enums,
        relations: adapter.relations,
        tables: adapter.tables,
      },
      adapter,
    )
    if (result.enums) {
      adapter.enums = result.enums
    }

    adapter.tables = result.tables
    adapter.relations = result.relations
  }
}
