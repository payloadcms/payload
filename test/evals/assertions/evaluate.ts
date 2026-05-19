import type { Assertion } from './types.js'

import {
  literalValue,
  parseConfig,
  type ParsedCollection,
  type ParsedField,
} from './parseConfig.js'

/**
 * Evaluates structural assertions against a generated payload.config.ts.
 * Returns one human-readable error string per failed assertion; an empty
 * array means all assertions held.
 */
export function evaluateAssertions(source: string, assertions: Assertion[]): string[] {
  if (assertions.length === 0) {
    return []
  }

  let parsed: ReturnType<typeof parseConfig>
  try {
    parsed = parseConfig(source)
  } catch (err) {
    return [`assertion parser failed: ${(err as Error).message}`]
  }

  const errors: string[] = []
  for (const assertion of assertions) {
    const error = evaluateOne(assertion, parsed.collections)
    if (error) {
      errors.push(error)
    }
  }
  return errors
}

function evaluateOne(assertion: Assertion, collections: ParsedCollection[]): null | string {
  switch (assertion.kind) {
    case 'blockField': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for block field "${assertion.subfield}" in "${assertion.field}.${assertion.blockSlug}")`
      }
      const blocksField = findField(collection.fields, assertion.field)
      if (!blocksField || blocksField.type !== 'blocks') {
        return `expected blocks field "${assertion.field}" on "${assertion.slug}" (for block "${assertion.blockSlug}")`
      }
      const block = blocksField.blocks?.find((b) => b.slug === assertion.blockSlug)
      if (!block) {
        return `expected block with slug "${assertion.blockSlug}" inside blocks field "${assertion.slug}.${assertion.field}"`
      }
      const sub = findField(block.fields, assertion.subfield)
      if (!sub) {
        return `expected field "${assertion.subfield}" inside block "${assertion.blockSlug}" of "${assertion.slug}.${assertion.field}"`
      }
      if (assertion.fieldType && sub.type !== assertion.fieldType) {
        return `expected field "${assertion.subfield}" in block "${assertion.blockSlug}" to have type "${assertion.fieldType}", got "${sub.type ?? '<unknown>'}"`
      }
      return null
    }

    case 'collectionAccess': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for access.${assertion.operation})`
      }
      if (!collection.access[assertion.operation]) {
        return `expected access.${assertion.operation} function on collection "${assertion.slug}"`
      }
      return null
    }

    case 'collectionExists': {
      return findCollection(collections, assertion.slug)
        ? null
        : `expected collection "${assertion.slug}" to exist`
    }

    case 'collectionHook': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for collection-level hook "${assertion.hook}")`
      }
      if (!collection.hooks[assertion.hook]) {
        return `expected collection-level hooks.${assertion.hook} on collection "${assertion.slug}"`
      }
      return null
    }

    case 'fieldExists': {
      const lookup = locateField(
        collections,
        assertion.slug,
        assertion.field,
        assertion.parentField,
      )
      if (lookup.error) {
        return lookup.error
      }
      if (assertion.fieldType && lookup.field!.type !== assertion.fieldType) {
        return `expected field "${describeFieldPath(assertion)}" to have type "${assertion.fieldType}", got "${lookup.field!.type ?? '<unknown>'}"`
      }
      return null
    }

    case 'fieldHook': {
      const lookup = locateField(
        collections,
        assertion.slug,
        assertion.field,
        assertion.parentField,
      )
      if (lookup.error) {
        return lookup.error
      }
      const field = lookup.field!
      if (field.hooks[assertion.hook]) {
        return null
      }
      const collectionHasHook = lookup.collection!.hooks[assertion.hook]
      const hint = collectionHasHook
        ? ` (found collection-level "${assertion.hook}" instead — must be on the field)`
        : ''
      return `expected field-level hooks.${assertion.hook} on "${describeFieldPath(assertion)}"${hint}`
    }

    case 'fieldOption': {
      const lookup = locateField(
        collections,
        assertion.slug,
        assertion.field,
        assertion.parentField,
      )
      if (lookup.error) {
        return lookup.error
      }
      const field = lookup.field!
      const expr = field.options[assertion.option]
      if (!expr) {
        return `expected field "${describeFieldPath(assertion)}" to set option "${assertion.option}"`
      }
      if (assertion.value !== undefined) {
        const actual = literalValue(expr)
        if (actual !== assertion.value) {
          return `expected field "${describeFieldPath(assertion)}" option "${assertion.option}" to equal ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actual)}`
        }
      }
      return null
    }
  }
}

type FieldLookup = {
  collection?: ParsedCollection
  error: null | string
  field?: ParsedField
}

function locateField(
  collections: ParsedCollection[],
  slug: string,
  fieldName: string,
  parentField?: string,
): FieldLookup {
  const collection = findCollection(collections, slug)
  if (!collection) {
    return { error: `expected collection "${slug}" (for field "${fieldName}")` }
  }
  if (!parentField) {
    const field = findField(collection.fields, fieldName)
    if (!field) {
      return { collection, error: `expected field "${fieldName}" on collection "${slug}"` }
    }
    return { collection, error: null, field }
  }
  const parent = findField(collection.fields, parentField)
  if (!parent) {
    return {
      collection,
      error: `expected parent field "${parentField}" on "${slug}" (for nested "${fieldName}")`,
    }
  }
  if (parent.type !== 'array' && parent.type !== 'group') {
    return {
      collection,
      error: `expected parent field "${slug}.${parentField}" to be type array or group, got "${parent.type ?? '<unknown>'}"`,
    }
  }
  const field = findField(parent.fields ?? [], fieldName)
  if (!field) {
    return {
      collection,
      error: `expected nested field "${fieldName}" inside "${slug}.${parentField}"`,
    }
  }
  return { collection, error: null, field }
}

function describeFieldPath(assertion: {
  field: string
  parentField?: string
  slug: string
}): string {
  return assertion.parentField
    ? `${assertion.slug}.${assertion.parentField}.${assertion.field}`
    : `${assertion.slug}.${assertion.field}`
}

function findCollection(
  collections: ParsedCollection[],
  slug: string,
): ParsedCollection | undefined {
  return collections.find((c) => c.slug === slug)
}

function findField(fields: ParsedField[], name: string): ParsedField | undefined {
  return fields.find((f) => f.name === name)
}
