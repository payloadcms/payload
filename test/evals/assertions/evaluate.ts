import ts from 'typescript'

import type { Assertion } from './types.js'

import {
  literalValue,
  parseConfig,
  type ParsedCollection,
  type ParsedField,
  resolveToObjectLiteral,
  walkPath,
  type WalkPathResult,
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
    const error = evaluateOne(assertion, parsed)
    if (error) {
      errors.push(error)
    }
  }
  return errors
}

function evaluateOne(assertion: Assertion, parsed: ReturnType<typeof parseConfig>): null | string {
  const { collections } = parsed
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

    case 'collectionOption': {
      const collection = findCollection(collections, assertion.slug)
      if (!collection) {
        return `expected collection "${assertion.slug}" (for option "${assertion.path}")`
      }
      const segments = assertion.path.split('.')
      const [root, ...rest] = segments as [string, ...string[]]
      const rootExpr = collection.options[root]
      if (!rootExpr) {
        return `expected collection "${assertion.slug}" to have option "${assertion.path}"`
      }
      let expr: ts.Expression
      if (rest.length > 0) {
        const result = walkPath(rootExpr, rest, parsed.symbols)
        if (!result.ok) {
          return result.reason === 'missing'
            ? `expected collection "${assertion.slug}" option "${assertion.path}" to exist (missing segment "${result.failedAt}")`
            : `expected collection "${assertion.slug}" option "${assertion.path}" path to descend through object literals (segment "${result.failedAt}" is not an object literal)`
        }
        expr = result.expr
      } else {
        expr = rootExpr
      }
      if (assertion.value !== undefined) {
        const error = checkValueWithBooleanShorthand(
          expr,
          assertion.value,
          `collection "${assertion.slug}" option "${assertion.path}"`,
          parsed.symbols,
        )
        if (error) {
          return error
        }
      }
      return null
    }

    case 'configOption': {
      const segments = assertion.path.split('.')
      const [root, ...rest] = segments as [string, ...string[]]
      const rootExpr = parsed.configOptions[root]
      if (!rootExpr) {
        return `expected buildConfig to have option "${assertion.path}"`
      }
      let expr: ts.Expression
      if (rest.length > 0) {
        const result = walkPath(rootExpr, rest, parsed.symbols)
        if (!result.ok) {
          return result.reason === 'missing'
            ? `expected buildConfig option "${assertion.path}" to exist (missing segment "${result.failedAt}")`
            : `expected buildConfig option "${assertion.path}" path to descend through object literals (segment "${result.failedAt}" is not an object literal)`
        }
        expr = result.expr
      } else {
        expr = rootExpr
      }
      if (assertion.value !== undefined) {
        const error = checkValueWithBooleanShorthand(
          expr,
          assertion.value,
          `buildConfig option "${assertion.path}"`,
          parsed.symbols,
        )
        if (error) {
          return error
        }
      }
      return null
    }

    case 'dbAdapterOption': {
      if (!parsed.db) {
        return `expected db adapter to be configured (for option "${assertion.path}")`
      }
      if (assertion.adapter && parsed.db.adapter !== assertion.adapter) {
        return `expected db adapter "${assertion.adapter}", got "${parsed.db.adapter}"`
      }
      const isUnknownAdapter = parsed.db.adapter === '<unknown>'
      const segments = assertion.path.split('.')
      const [root, ...rest] = segments as [string, ...string[]]
      const rootExpr = parsed.db.options[root]
      if (!rootExpr) {
        const unknownNote = isUnknownAdapter
          ? ' (note: parser did not recognize the db adapter call expression)'
          : ''
        return `expected db adapter to have option "${assertion.path}"${unknownNote}`
      }
      let expr: ts.Expression
      if (rest.length > 0) {
        const result = walkPath(rootExpr, rest, parsed.symbols)
        if (!result.ok) {
          const unknownNote = isUnknownAdapter
            ? ' (note: parser did not recognize the db adapter call expression)'
            : ''
          return result.reason === 'missing'
            ? `expected db adapter option "${assertion.path}" to exist (missing segment "${result.failedAt}")${unknownNote}`
            : `expected db adapter option "${assertion.path}" path to descend through object literals (segment "${result.failedAt}" is not an object literal)${unknownNote}`
        }
        expr = result.expr
      } else {
        expr = rootExpr
      }
      if (assertion.value !== undefined) {
        const error = checkValueWithBooleanShorthand(
          expr,
          assertion.value,
          `db adapter option "${assertion.path}"`,
          parsed.symbols,
        )
        if (error) {
          return error
        }
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
        if (actual === assertion.value) {
          return null
        }
        if (actual === undefined) {
          // expr exists but is not a primitive literal (function call, identifier, etc.)
          return `expected field "${describeFieldPath(assertion)}" option "${assertion.option}" to equal ${JSON.stringify(assertion.value)}, got non-literal expression (${ts.SyntaxKind[expr.kind]})`
        }
        return `expected field "${describeFieldPath(assertion)}" option "${assertion.option}" to equal ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actual)}`
      }
      return null
    }

    case 'jobsTask': {
      if (!parsed.jobs) {
        return `expected jobs config to be present (for task "${assertion.slug}")`
      }
      return parsed.jobs.tasks.some((t) => t.slug === assertion.slug)
        ? null
        : `expected jobs.tasks to contain a task with slug "${assertion.slug}"`
    }

    case 'jobsWorkflow': {
      if (!parsed.jobs) {
        return `expected jobs config to be present (for workflow "${assertion.slug}")`
      }
      return parsed.jobs.workflows.some((w) => w.slug === assertion.slug)
        ? null
        : `expected jobs.workflows to contain a workflow with slug "${assertion.slug}"`
    }

    default: {
      const _exhaustive: never = assertion
      return null
    }
  }
}

/**
 * Checks a walked expression against an expected value, implementing the
 * boolean shorthand rule:
 *
 * When `expected` is `true` AND the expression resolves to an ObjectLiteral,
 * the check passes — an object value implies the feature is enabled (e.g.
 * `auth.loginWithUsername: { allowEmailLogin: true }` satisfies `value: true`).
 *
 * For `expected: false` or any primitive, strict literal equality is required.
 *
 * Returns an error string on mismatch, or `null` on success.
 */
function checkValueWithBooleanShorthand(
  expr: ts.Expression,
  expected: boolean | number | string,
  label: string,
  symbols: Map<string, ts.Expression>,
): null | string {
  // Boolean shorthand: object presence satisfies value: true
  if (expected === true) {
    const asObj = resolveToObjectLiteral(expr, symbols)
    if (asObj) {
      return null
    }
  }
  const actual = literalValue(expr)
  if (actual !== expected) {
    return `expected ${label} to equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  }
  return null
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
