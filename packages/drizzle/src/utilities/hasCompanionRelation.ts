import type { DrizzleAdapter } from '../types.js'

type CompanionRelation = '_locales' | '_numbers' | '_rels' | '_texts'

/**
 * Whether a table has the given companion table (`_locales`, `_numbers`, `_rels` or `_texts`).
 * Checks the relations built for the table rather than looking up `<tableName><suffix>`, which
 * can also be the table of an array or `hasMany` select field with that name.
 */
export const hasCompanionRelation = ({
  adapter,
  relation,
  tableName,
}: {
  adapter: Pick<DrizzleAdapter, 'rawRelations'>
  relation: CompanionRelation
  tableName: string
}): boolean => Boolean(adapter.rawRelations[tableName]?.[relation])
