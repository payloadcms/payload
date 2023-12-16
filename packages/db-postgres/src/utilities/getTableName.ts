import toSnakeCase from 'to-snake-case'

type EntityConfig = {
  enumName?: string
  name?: string
  prefer?: 'enumName' | 'tableName'
  slug?: string
  tableName?: string
}

export const getTableName = ({
  name,
  enumName,
  prefer = 'tableName',
  slug,
  tableName,
}: EntityConfig) => {
  const generated = toSnakeCase(name ?? slug)
  const custom = prefer === 'tableName' ? tableName ?? enumName : enumName ?? tableName
  return custom ?? generated
}
