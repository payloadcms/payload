import type { DrizzleAdapter } from '../types.js'

type CompanionRelation = '_locales' | '_numbers' | '_rels' | '_texts'

/**
 * Whether a table has the given companion table (`_locales`, `_numbers`, `_rels` or `_texts`).
 * Checks the relations built for the table rather than looking up `<tableName><suffix>`, which
 * can also be the table of an array or `hasMany` select field with that name. The relation's
 * target must exist too: an array or block whose only localized field is a `hasMany` number or
 * text field gets a `_locales` relation, but its values are stored in the root table's companion.
 */
export const hasCompanionRelation = ({
  adapter,
  relation,
  tableName,
}: {
  adapter: Pick<DrizzleAdapter, 'rawRelations' | 'rawTables'>
  relation: CompanionRelation
  tableName: string
}): boolean => {
  const companion = adapter.rawRelations[tableName]?.[relation]

  return Boolean(companion && adapter.rawTables[companion.to])
}
