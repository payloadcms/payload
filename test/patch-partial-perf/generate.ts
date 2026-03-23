/**
 * Deterministic generator for N collection schemas with varying field permutations,
 * matching FormState builders, and seed data factories.
 *
 * Field permutations are derived from the collection index so every run is reproducible.
 */
import type { CollectionConfig, Field } from 'payload'
import type { FormState } from 'payload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditScenario =
  | 'all_fields'
  | 'array_content'
  | 'half_top_level'
  | 'nested_group_leaf'
  | 'relations_only'
  | 'title_only'

export const ALL_SCENARIOS: EditScenario[] = [
  'title_only',
  'half_top_level',
  'all_fields',
  'relations_only',
  'nested_group_leaf',
  'array_content',
]

export type CollectionShape = {
  arrayFieldCount: number
  arrayRowFieldCount: number
  config: CollectionConfig
  groupFieldCount: number
  hasArray: boolean
  hasGroup: boolean
  hasHasManyRel: boolean
  hasJson: boolean
  hasSingleRel: boolean
  index: number
  numberFieldCount: number
  selectFieldCount: number
  slug: string
  textareaCount: number
  textCount: number
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

export const TAGS_SLUG = 'perf-tags'

export function collectionSlug(index: number): string {
  return `perf-c${String(index).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Collection schema generator
// ---------------------------------------------------------------------------

export function generateCollectionShape(index: number): CollectionShape {
  const slug = collectionSlug(index)

  const textCount = (index % 8) + 1
  const numberFieldCount = index % 4
  const textareaCount = index % 5 === 0 ? Math.min((index % 3) + 1, 3) : 0
  const selectFieldCount = index % 6 === 0 ? 1 + (index % 2) : 0
  const hasGroup = index % 2 === 0
  const groupFieldCount = hasGroup ? (index % 5) + 2 : 0
  const hasArray = index % 3 !== 2
  const arrayFieldCount = hasArray ? 1 : 0
  const arrayRowFieldCount = hasArray ? (index % 4) + 2 : 0
  const hasJson = index % 4 === 0
  const hasSingleRel = index % 3 === 1
  const hasHasManyRel = index % 5 === 0

  const fields: Field[] = [{ name: 'title', type: 'text', required: true }]

  for (let t = 0; t < textCount; t++) {
    fields.push({ name: `txt${t}`, type: 'text' })
  }

  for (let n = 0; n < numberFieldCount; n++) {
    fields.push({ name: `num${n}`, type: 'number' })
  }

  for (let ta = 0; ta < textareaCount; ta++) {
    fields.push({ name: `ta${ta}`, type: 'textarea' })
  }

  for (let s = 0; s < selectFieldCount; s++) {
    fields.push({
      name: `sel${s}`,
      type: 'select',
      options: ['optA', 'optB', 'optC', 'optD'],
    })
  }

  if (hasGroup) {
    const groupFields: Field[] = []
    for (let g = 0; g < groupFieldCount; g++) {
      groupFields.push({ name: `gf${g}`, type: 'text' })
    }
    fields.push({ name: 'grp', type: 'group', fields: groupFields })
  }

  if (hasArray) {
    const rowFields: Field[] = [{ name: 'rowType', type: 'text' }]
    for (let r = 1; r < arrayRowFieldCount; r++) {
      rowFields.push({ name: `rf${r}`, type: 'text' })
    }
    fields.push({ name: 'arr', type: 'array', fields: rowFields })
  }

  if (hasJson) {
    fields.push({ name: 'blob', type: 'json' })
  }

  if (hasSingleRel) {
    fields.push({ name: 'relSingle', type: 'relationship', relationTo: TAGS_SLUG })
  }

  if (hasHasManyRel) {
    fields.push({
      name: 'relMany',
      type: 'relationship',
      hasMany: true,
      relationTo: TAGS_SLUG,
    })
  }

  const config: CollectionConfig = {
    slug,
    admin: { hidden: true },
    fields,
  }

  return {
    slug,
    arrayFieldCount,
    arrayRowFieldCount,
    config,
    groupFieldCount,
    hasArray,
    hasGroup,
    hasHasManyRel,
    hasJson,
    hasSingleRel,
    index,
    numberFieldCount,
    selectFieldCount,
    textareaCount,
    textCount,
  }
}

export function generateAllShapes(count: number): CollectionShape[] {
  return Array.from({ length: count }, (_, i) => generateCollectionShape(i))
}

// ---------------------------------------------------------------------------
// FormState builder (for reducer benchmarks — no DB needed)
// ---------------------------------------------------------------------------

type FF = NonNullable<FormState[string]>

const f = (value: unknown, initialValue: unknown): FF => ({ initialValue, value })
const same = (v: unknown): FF => f(v, v)

export function buildFormStateForShape(shape: CollectionShape, scenario: EditScenario): FormState {
  const state: FormState = {}
  const changed = new Set<string>()

  const titleVal = 'Benchmark title value'

  // Decide which top-level keys to mark as changed
  const allTopKeys: string[] = ['title']
  for (let t = 0; t < shape.textCount; t++) {allTopKeys.push(`txt${t}`)}
  for (let n = 0; n < shape.numberFieldCount; n++) {allTopKeys.push(`num${n}`)}
  for (let ta = 0; ta < shape.textareaCount; ta++) {allTopKeys.push(`ta${ta}`)}
  for (let s = 0; s < shape.selectFieldCount; s++) {allTopKeys.push(`sel${s}`)}
  if (shape.hasGroup) {allTopKeys.push('grp')}
  if (shape.hasArray) {allTopKeys.push('arr')}
  if (shape.hasJson) {allTopKeys.push('blob')}
  if (shape.hasSingleRel) {allTopKeys.push('relSingle')}
  if (shape.hasHasManyRel) {allTopKeys.push('relMany')}

  switch (scenario) {
    case 'all_fields':
      allTopKeys.forEach((k) => changed.add(k))
      break
    case 'array_content':
      if (shape.hasArray) {
        changed.add('arr')
      } else {
        changed.add('title')
      }
      break
    case 'half_top_level':
      allTopKeys.forEach((k, i) => {
        if (i % 2 === 0) {changed.add(k)}
      })
      break
    case 'nested_group_leaf':
      if (shape.hasGroup) {
        changed.add('grp')
      } else {
        changed.add('title')
      }
      break
    case 'relations_only':
      if (shape.hasSingleRel) {changed.add('relSingle')}
      if (shape.hasHasManyRel) {changed.add('relMany')}
      if (changed.size === 0) {changed.add('title')}
      break
    case 'title_only':
      changed.add('title')
      break
  }

  const isChanged = (key: string) => changed.has(key)

  // title
  state.title = isChanged('title') ? f('CHANGED title', titleVal) : same(titleVal)

  // text fields
  for (let t = 0; t < shape.textCount; t++) {
    const k = `txt${t}`
    const v = `text-val-${t}-${'a'.repeat(40)}`
    state[k] = isChanged(k) ? f(`${v}-EDITED`, v) : same(v)
  }

  // number fields
  for (let n = 0; n < shape.numberFieldCount; n++) {
    const k = `num${n}`
    state[k] = isChanged(k) ? f(n * 100 + 1, n * 100) : same(n * 100)
  }

  // textarea
  for (let ta = 0; ta < shape.textareaCount; ta++) {
    const k = `ta${ta}`
    const v = 'b'.repeat(300)
    state[k] = isChanged(k) ? f(`${v}-EDITED`, v) : same(v)
  }

  // select
  for (let s = 0; s < shape.selectFieldCount; s++) {
    const k = `sel${s}`
    state[k] = isChanged(k) ? f('optC', 'optA') : same('optA')
  }

  // group
  if (shape.hasGroup) {
    for (let g = 0; g < shape.groupFieldCount; g++) {
      const path = `grp.gf${g}`
      const v = `grp-val-${g}-${'g'.repeat(30)}`
      if (
        isChanged('grp') &&
        (scenario === 'all_fields' || scenario === 'half_top_level' || g === 0)
      ) {
        state[path] = f(`${v}-EDITED`, v)
      } else {
        state[path] = same(v)
      }
    }
  }

  // array (16 rows)
  if (shape.hasArray) {
    const rowCount = 16
    for (let r = 0; r < rowCount; r++) {
      state[`arr.${r}.rowType`] = same(r % 2 === 0 ? 'typeA' : 'typeB')
      for (let rf = 1; rf < shape.arrayRowFieldCount; rf++) {
        const path = `arr.${r}.rf${rf}`
        const v = `row${r}-rf${rf}-${'r'.repeat(60)}`
        if (isChanged('arr') && (r === 0 || r === 8)) {
          state[path] = f(`${v}-EDITED`, v)
        } else {
          state[path] = same(v)
        }
      }
    }
  }

  // json blob
  if (shape.hasJson) {
    const blob = Object.fromEntries(
      Array.from({ length: 30 }, (_, j) => [`k${j}`, { nested: 'z'.repeat(80) }]),
    )
    if (isChanged('blob')) {
      const editedBlob = { ...blob, k0: { nested: 'CHANGED'.repeat(12) } }
      state.blob = f(editedBlob, blob)
    } else {
      state.blob = same(blob)
    }
  }

  // relationships
  if (shape.hasSingleRel) {
    state.relSingle = isChanged('relSingle') ? f(99, 1) : same(1)
  }
  if (shape.hasHasManyRel) {
    const ids = Array.from({ length: 12 }, (_, i) => i + 1)
    if (isChanged('relMany')) {
      state.relMany = f([...ids, 99], ids)
    } else {
      state.relMany = same(ids)
    }
  }

  return state
}

// ---------------------------------------------------------------------------
// Seed data builder (for payload.update DB benchmarks)
// ---------------------------------------------------------------------------

export function buildSeedData(
  shape: CollectionShape,
  tagIds: (number | string)[],
): Record<string, unknown> {
  const data: Record<string, unknown> = { title: 'Seed document' }

  for (let t = 0; t < shape.textCount; t++) {
    data[`txt${t}`] = `text-val-${t}-${'a'.repeat(40)}`
  }
  for (let n = 0; n < shape.numberFieldCount; n++) {
    data[`num${n}`] = n * 100
  }
  for (let ta = 0; ta < shape.textareaCount; ta++) {
    data[`ta${ta}`] = 'b'.repeat(300)
  }
  for (let s = 0; s < shape.selectFieldCount; s++) {
    data[`sel${s}`] = 'optA'
  }
  if (shape.hasGroup) {
    const grp: Record<string, string> = {}
    for (let g = 0; g < shape.groupFieldCount; g++) {
      grp[`gf${g}`] = `grp-val-${g}-${'g'.repeat(30)}`
    }
    data.grp = grp
  }
  if (shape.hasArray) {
    data.arr = Array.from({ length: 16 }, (_, r) => {
      const row: Record<string, string> = { rowType: r % 2 === 0 ? 'typeA' : 'typeB' }
      for (let rf = 1; rf < shape.arrayRowFieldCount; rf++) {
        row[`rf${rf}`] = `row${r}-rf${rf}-${'r'.repeat(60)}`
      }
      return row
    })
  }
  if (shape.hasJson) {
    data.blob = Object.fromEntries(
      Array.from({ length: 30 }, (_, j) => [`k${j}`, { nested: 'z'.repeat(80) }]),
    )
  }
  if (shape.hasSingleRel) {
    data.relSingle = tagIds[0] ?? null
  }
  if (shape.hasHasManyRel) {
    data.relMany = tagIds.slice(0, 12)
  }

  return data
}

/**
 * Build a "partial" update body matching a scenario —
 * only the keys that would change under that scenario.
 */
export function buildPartialUpdate(
  shape: CollectionShape,
  scenario: EditScenario,
  iteration: number,
  tagIds: (number | string)[],
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  switch (scenario) {
    case 'all_fields':
      return { ...buildSeedData(shape, tagIds), title: `all-${iteration}` }

    case 'array_content':
      if (shape.hasArray) {
        data.arr = [{ rf1: `edited-row-${iteration}`, rowType: 'typeA' }]
      } else {
        data.title = `arr-fallback-${iteration}`
      }
      break

    case 'half_top_level': {
      data.title = `half-${iteration}`
      for (let t = 0; t < shape.textCount; t += 2) {
        data[`txt${t}`] = `half-text-${t}-${iteration}`
      }
      for (let n = 0; n < shape.numberFieldCount; n += 2) {
        data[`num${n}`] = iteration * 10 + n
      }
      break
    }

    case 'nested_group_leaf':
      if (shape.hasGroup) {
        data.grp = { gf0: `edited-leaf-${iteration}` }
      } else {
        data.title = `grp-fallback-${iteration}`
      }
      break

    case 'relations_only':
      if (shape.hasSingleRel) {data.relSingle = tagIds[iteration % tagIds.length] ?? null}
      if (shape.hasHasManyRel) {data.relMany = tagIds.slice(0, 6)}
      if (Object.keys(data).length === 0) {data.title = `rel-fallback-${iteration}`}
      break

    case 'title_only':
      data.title = `partial-title-${iteration}`
      break
  }

  return data
}
