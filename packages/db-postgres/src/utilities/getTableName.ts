import toSnakeCase from 'to-snake-case'

type EntityConfig = {
  enumName?: string
  name?: string
  slug?: string
  tableName?: string
}

export const getTableName = ({ name, enumName, slug, tableName }: EntityConfig) => {
  const generated = toSnakeCase(name ?? slug)
  const custom = tableName ?? enumName
  return custom ?? generated
}
