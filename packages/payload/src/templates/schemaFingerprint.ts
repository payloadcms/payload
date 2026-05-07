import { createHash } from 'crypto'

import type { Field } from '../fields/config/types.js'

/**
 * Build a JSON-serialisable structural snapshot of a field tree.
 *
 * Captured: field name, type, nesting (array/group/blocks), block slugs,
 * relationship targets, select/radio option values, required flag.
 *
 * Stripped: functions (validators, hooks, defaultValue functions), components,
 * admin config, labels — anything that is purely visual or behavioural and
 * doesn't affect template compatibility.
 *
 * The snapshot is the source of truth for `computeSchemaHash`.
 */
export function buildSchemaSnapshot(fields: Field[] | null | undefined): unknown[] {
  if (!fields || fields.length === 0) {
    return []
  }

  return fields.map(buildFieldSnapshot)
}

function buildFieldSnapshot(field: Field): Record<string, unknown> {
  const snapshot: Record<string, unknown> = { type: field.type }

  if ('name' in field && typeof field.name === 'string') {
    snapshot.name = field.name
  }

  if ('required' in field && field.required) {
    snapshot.required = true
  }

  switch (field.type) {
    case 'array':
      snapshot.fields = buildSchemaSnapshot(field.fields)
      break

    case 'blocks': {
      const blocks = field.blocks ?? []
      snapshot.blocks = blocks.map((block) => ({
        slug: block.slug,
        fields: buildSchemaSnapshot(block.fields),
      }))
      break
    }

    case 'collapsible':
    case 'row':
      snapshot.fields = buildSchemaSnapshot(field.fields)
      break

    case 'group':
      snapshot.fields = buildSchemaSnapshot(field.fields)
      break

    case 'radio':
    case 'select':
      snapshot.options = (field.options ?? []).map((opt) =>
        typeof opt === 'string' ? opt : opt.value,
      )
      break

    case 'relationship':
    case 'upload':
      snapshot.relationTo = field.relationTo
      break

    case 'tabs':
      snapshot.tabs = field.tabs.map((tab) => ({
        ...('name' in tab && typeof tab.name === 'string' ? { name: tab.name } : {}),
        fields: buildSchemaSnapshot(tab.fields),
      }))
      break

    default:
      break
  }

  return snapshot
}

/**
 * Compute a deterministic hash of a schema snapshot.
 *
 * Stable across processes — input order is preserved (snapshots are arrays),
 * object keys are alphabetised before hashing. Returns a `sha256:`-prefixed
 * hex digest.
 */
export function computeSchemaHash(snapshot: unknown): string {
  const stable = stableStringify(snapshot)
  const digest = createHash('sha256').update(stable).digest('hex')
  return `sha256:${digest}`
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
      )
    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}
