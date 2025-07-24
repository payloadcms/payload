import { alias } from 'drizzle-orm/pg-core'
import { inArray } from 'drizzle-orm/pg-core/expressions'

import type { DeleteWhere } from './types.js'

export const deleteWhere: DeleteWhere = async function deleteWhere({
  db,
  joins = [],
  tableName,
  where,
}) {
  const root = this.tables[tableName]

  if (!joins?.length) {
    // simple path – still give callers the same buildWhere API
    await db.delete(root).where(where)
    return
  }

  try {
    // ── Build a sub‑query with deterministic aliases ────────────────
    const sub = db.select({ id: root.id }).from(root)

    const ctx: Record<string, any> = { [tableName]: root }

    for (const join of joins) {
      // give each joined table either the supplied alias or a stable one
      ctx[join.table[Symbol.for('drizzle.name')]] = join.table

      // @ts-expect-error
      sub[join.type ?? 'innerJoin'](join.table, join.condition(ctx))
    }

    sub.where(where)

    await db.delete(root).where(inArray(root.id, sub))
  } catch (err) {
    console.error('Error in deleteWhere:', err)
  }
}
