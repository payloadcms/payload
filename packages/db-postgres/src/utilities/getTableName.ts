import toSnakeCase from 'to-snake-case'

export const getTableName = (
  entityConfig: { tableName?: string } & (
    | {
        name: string
      }
    | {
        slug: string
      }
  ),
) => {
  if (entityConfig.tableName) return entityConfig.tableName
  if ('name' in entityConfig) return toSnakeCase(entityConfig.name)
  return toSnakeCase(entityConfig.slug)
}
