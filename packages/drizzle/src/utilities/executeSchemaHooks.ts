import type { DrizzleAdapter } from '../types.js'

type DatabaseSchema = {
  enums?: DrizzleAdapter['enums']
  relations: Record<string, any>
  tables: DrizzleAdapter['tables']
}

type Adapter = {
  afterSchemaInit: DatabaseSchemaHook[]
  beforeSchemaInit: DatabaseSchemaHook[]
} & DatabaseSchema

type DatabaseSchemaHookArgs = {
  adapter: Record<string, unknown>
  schema: DatabaseSchema
}

type DatabaseSchemaHook = (args: DatabaseSchemaHookArgs) => DatabaseSchema | Promise<DatabaseSchema>

type Args = {
  adapter: Adapter
  type: 'afterSchemaInit' | 'beforeSchemaInit'
}

export const executeSchemaHooks = async ({ type, adapter }: Args) => {
  for (const hook of adapter[type]) {
    const result = await hook({
      adapter,
      schema: {
        enums: adapter.enums,
        relations: adapter.relations,
        tables: adapter.tables,
      },
    })
    if (result.enums) {
      adapter.enums = result.enums
    }

    adapter.tables = result.tables
    adapter.relations = result.relations
  }
}
