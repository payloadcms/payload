import toSnakeCase from 'to-snake-case'

type Options = {
  prefer: 'enumName' | 'tableName'
}

type EntityConfig = {
  enumName?: string
  name?: string
  slug?: string
  tableName?: string
}

export const getTableName = (
  { name, enumName, slug, tableName }: EntityConfig,
  { prefer }: Options = { prefer: 'tableName' },
) => {
  const generated = toSnakeCase(name ?? slug)
  const custom = prefer === 'tableName' ? tableName ?? enumName : enumName ?? tableName
  return custom ?? generated
}
