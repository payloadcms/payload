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
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for field "${assertion.field}")`
      }
      const field = findField(collection, assertion.field)
      if (!field) {
        return `expected field "${assertion.field}" on collection "${assertion.slug}"`
      }
      if (assertion.fieldType && field.type !== assertion.fieldType) {
        return `expected field "${assertion.field}" on "${assertion.slug}" to have type "${assertion.fieldType}", got "${field.type ?? '<unknown>'}"`
      }
      return null
    }
    case 'fieldHook': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for field-level hook "${assertion.hook}" on "${assertion.field}")`
      }
      const field = findField(collection, assertion.field)
      if (!field) {
        return `expected field "${assertion.field}" on "${assertion.slug}" (for field-level hook "${assertion.hook}")`
      }
      if (!field.hooks[assertion.hook]) {
        const collectionHasHook = collection.hooks[assertion.hook]
        const hint = collectionHasHook
          ? ` (found collection-level "${assertion.hook}" instead — must be on the field)`
          : ''
        return `expected field-level hooks.${assertion.hook} on "${assertion.slug}.${assertion.field}"${hint}`
      }
      return null
    }
    case 'fieldOption': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for field option "${assertion.option}" on "${assertion.field}")`
      }
      const field = findField(collection, assertion.field)
      if (!field) {
        return `expected field "${assertion.field}" on "${assertion.slug}" (for option "${assertion.option}")`
      }
      const expr = field.options[assertion.option]
      if (!expr) {
        return `expected field "${assertion.slug}.${assertion.field}" to set option "${assertion.option}"`
      }
      if (assertion.value !== undefined) {
        const actual = literalValue(expr)
        if (actual !== assertion.value) {
          return `expected field "${assertion.slug}.${assertion.field}" option "${assertion.option}" to equal ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actual)}`
        }
      }
      return null
    }
  }
}

function findCollection(
  collections: ParsedCollection[],
  slug: string,
): ParsedCollection | undefined {
  return collections.find((c) => c.slug === slug)
}

function findField(collection: ParsedCollection, name: string): ParsedField | undefined {
  return collection.fields.find((f) => f.name === name)
}
