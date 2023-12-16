import toSnakeCase from 'to-snake-case'

export const getTableName = (
  entityConfig: ({ enumName?: string } | { tableName?: string }) &
    (
      | {
          name: string
        }
      | {
          slug: string
        }
    ),
) => {
  if ('tableName' in entityConfig) return entityConfig.tableName
  if ('enumName' in entityConfig) return entityConfig.enumName
  if ('name' in entityConfig) return toSnakeCase(entityConfig.name)
  return toSnakeCase(entityConfig.slug)
}
