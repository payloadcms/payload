import ts from 'typescript'

import type { AdapterName } from './types.js'

export type ParsedField = {
  /** For `blocks` fields: the parsed block configs in `blocks: [...]`. */
  blocks?: ParsedBlock[]
  /** For `array` and `group` fields: the parsed nested fields in `fields: [...]`. */
  fields?: ParsedField[]
  hooks: Record<string, boolean>
  name?: string
  options: Record<string, ts.Expression>
  type?: string
}

export type ParsedBlock = {
  fields: ParsedField[]
  slug?: string
}

export type ParsedCollection = {
  /** Map of operation name (read/create/update/delete/...) to whether `access.{op}` is defined. */
  access: Record<string, boolean>
  fields: ParsedField[]
  hooks: Record<string, boolean>
  /** Top-level collection keys excluding `fields`, `hooks`, `access`, `slug`. Captures `versions`, `auth`, `admin`, `timestamps`, `upload`, etc. as raw AST expressions. */
  options: Record<string, ts.Expression>
  slug?: string
}

export type ParsedConfig = {
  collections: ParsedCollection[]
  /** Top-level buildConfig keys excluding `collections`, `db`, and `jobs`. Captured as raw AST expressions so dotted paths can be walked. */
  configOptions: Record<string, ts.Expression>
  /** Parsed db adapter call: which adapter is in use and the object literal passed to it. */
  db?: { adapter: '<unknown>' | AdapterName; options: Record<string, ts.Expression> }
  /** Parsed jobs config. */
  jobs?: {
    options: Record<string, ts.Expression>
    tasks: Array<{ slug?: string }>
    workflows: Array<{ slug?: string }>
  }
  /** Top-level symbol table mapping identifier names to their AST initializers. Exposed so the evaluator's `walkPath` helper can chase identifier references across nested paths. */
  symbols: Map<string, ts.Expression>
}

/**
 * Parses an LLM-generated payload.config.ts source string into a structural
 * model focused on what the assertion DSL needs (collection slugs, fields,
 * hooks at each level, access functions, block definitions, top-level config
 * options, db adapter options, and jobs config). Resolves top-level identifier
 * references so configs that pull collections out into named consts work.
 */
export function parseConfig(source: string): ParsedConfig {
  const sourceFile = ts.createSourceFile('config.ts', source, ts.ScriptTarget.Latest, true)
  const symbols = collectTopLevelSymbols(sourceFile)

  const buildConfigCall = findBuildConfigCall(sourceFile)
  if (!buildConfigCall || buildConfigCall.arguments.length === 0) {
    return { collections: [], configOptions: {}, symbols }
  }

  const configArg = resolveToObjectLiteral(buildConfigCall.arguments[0]!, symbols)
  if (!configArg) {
    return { collections: [], configOptions: {}, symbols }
  }

  const configOptions = collectConfigOptions(configArg)
  const db = collectDbAdapter(configArg, symbols)
  const jobs = collectJobs(configArg, symbols)

  return {
    collections: collectCollections(configArg, symbols),
    configOptions,
    db,
    jobs,
    symbols,
  }
}

/**
 * Structured result from `walkPath`. On success, `expr` holds the resolved
 * expression. On failure, `failedAt` names the segment that couldn't be
 * resolved and `reason` distinguishes "the key was absent" from "the
 * intermediate node was not an object literal".
 */
export type WalkPathResult =
  | { expr: ts.Expression; ok: true }
  | { failedAt: string; ok: false; reason: 'missing' | 'not-object' }

/**
 * Walks a dotted path through nested object literals, resolving identifier
 * references at each step via the symbols map.
 *
 * For example, given the expression for `admin: { importMap: { baseDir: './src' } }`
 * and path `['admin', 'importMap', 'baseDir']`, returns the expression for `'./src'`.
 *
 * Returns a structured result indicating success or the specific failure reason
 * (missing key or non-object intermediate node).
 *
 * Boolean shorthand: when the final path segment resolves to an
 * `ObjectLiteralExpression`, the evaluator may treat that as satisfying
 * `value: true` (presence of an object means the feature is enabled). This
 * function returns the object expression — the caller decides how to compare.
 */
export function walkPath(
  expr: ts.Expression,
  path: string[],
  symbols: Map<string, ts.Expression>,
): WalkPathResult {
  if (path.length === 0) {
    return { expr, ok: true }
  }
  const obj = resolveToObjectLiteral(expr, symbols)
  const [head, ...rest] = path as [string, ...string[]]
  if (!obj) {
    return { failedAt: head, ok: false, reason: 'not-object' }
  }
  const next = getProp(obj, head)
  if (!next) {
    return { failedAt: head, ok: false, reason: 'missing' }
  }
  if (rest.length === 0) {
    return { expr: next, ok: true }
  }
  return walkPath(next, rest, symbols)
}

function collectTopLevelSymbols(sourceFile: ts.SourceFile): Map<string, ts.Expression> {
  const symbols = new Map<string, ts.Expression>()
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) {
      continue
    }
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) {
        symbols.set(decl.name.text, decl.initializer)
      }
    }
  }
  return symbols
}

function findBuildConfigCall(sourceFile: ts.SourceFile): ts.CallExpression | undefined {
  let found: ts.CallExpression | undefined
  function visit(node: ts.Node): void {
    if (found) {
      return
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'buildConfig'
    ) {
      found = node
      return
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
  return found
}

function unwrap(node: ts.Expression): ts.Expression {
  let current: ts.Expression = node
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
  return current
}

export function resolveToObjectLiteral(
  node: ts.Expression,
  symbols: Map<string, ts.Expression>,
  seen: Set<string> = new Set(),
): ts.ObjectLiteralExpression | undefined {
  const unwrapped = unwrap(node)
  if (ts.isObjectLiteralExpression(unwrapped)) {
    return unwrapped
  }
  if (ts.isIdentifier(unwrapped) && !seen.has(unwrapped.text) && symbols.has(unwrapped.text)) {
    seen.add(unwrapped.text)
    return resolveToObjectLiteral(symbols.get(unwrapped.text)!, symbols, seen)
  }
  return undefined
}

function resolveToArrayLiteral(
  node: ts.Expression,
  symbols: Map<string, ts.Expression>,
  seen: Set<string> = new Set(),
): ts.ArrayLiteralExpression | undefined {
  const unwrapped = unwrap(node)
  if (ts.isArrayLiteralExpression(unwrapped)) {
    return unwrapped
  }
  if (ts.isIdentifier(unwrapped) && !seen.has(unwrapped.text) && symbols.has(unwrapped.text)) {
    seen.add(unwrapped.text)
    return resolveToArrayLiteral(symbols.get(unwrapped.text)!, symbols, seen)
  }
  return undefined
}

function getProp(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ((ts.isIdentifier(prop.name) && prop.name.text === name) ||
        (ts.isStringLiteral(prop.name) && prop.name.text === name))
    ) {
      return prop.initializer
    }
  }
  return undefined
}

function getString(node: ts.Expression | undefined): string | undefined {
  if (!node) {
    return undefined
  }
  const u = unwrap(node)
  if (ts.isStringLiteral(u) || ts.isNoSubstitutionTemplateLiteral(u)) {
    return u.text
  }
  return undefined
}

function collectHooks(
  obj: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): Record<string, boolean> {
  const hooksProp = getProp(obj, 'hooks')
  if (!hooksProp) {
    return {}
  }
  const hooksObj = resolveToObjectLiteral(hooksProp, symbols)
  if (!hooksObj) {
    return {}
  }
  const out: Record<string, boolean> = {}
  for (const prop of hooksObj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name) || !prop.initializer) {
      continue
    }
    const arr = resolveToArrayLiteral(prop.initializer, symbols)
    out[prop.name.text] = Boolean(arr && arr.elements.length > 0)
  }
  return out
}

function collectAccess(
  obj: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): Record<string, boolean> {
  const accessProp = getProp(obj, 'access')
  if (!accessProp) {
    return {}
  }
  const accessObj = resolveToObjectLiteral(accessProp, symbols)
  if (!accessObj) {
    return {}
  }
  const out: Record<string, boolean> = {}
  for (const prop of accessObj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      out[prop.name.text] = true
    }
  }
  return out
}

function collectFieldOptions(obj: ts.ObjectLiteralExpression): Record<string, ts.Expression> {
  const out: Record<string, ts.Expression> = {}
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      out[prop.name.text] = prop.initializer
    }
  }
  return out
}

function collectBlocks(
  fieldObj: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedBlock[] | undefined {
  const blocksProp = getProp(fieldObj, 'blocks')
  if (!blocksProp) {
    return undefined
  }
  const arr = resolveToArrayLiteral(blocksProp, symbols)
  if (!arr) {
    return []
  }
  const blocks: ParsedBlock[] = []
  for (const element of arr.elements) {
    const blockObj = resolveToObjectLiteral(element, symbols)
    if (!blockObj) {
      continue
    }
    blocks.push({
      slug: getString(getProp(blockObj, 'slug')),
      fields: collectFieldsFrom(blockObj, symbols),
    })
  }
  return blocks
}

function parseField(
  fieldObj: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedField {
  const type = getString(getProp(fieldObj, 'type'))
  const field: ParsedField = {
    name: getString(getProp(fieldObj, 'name')),
    type,
    hooks: collectHooks(fieldObj, symbols),
    options: collectFieldOptions(fieldObj),
  }
  if (type === 'array' || type === 'group') {
    field.fields = collectFieldsFrom(fieldObj, symbols)
  }
  if (type === 'blocks') {
    field.blocks = collectBlocks(fieldObj, symbols)
  }
  return field
}

function collectFieldsFrom(
  obj: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedField[] {
  const fieldsProp = getProp(obj, 'fields')
  if (!fieldsProp) {
    return []
  }
  const arr = resolveToArrayLiteral(fieldsProp, symbols)
  if (!arr) {
    return []
  }
  const fields: ParsedField[] = []
  for (const element of arr.elements) {
    const fieldObj = resolveToObjectLiteral(element, symbols)
    if (!fieldObj) {
      continue
    }
    fields.push(parseField(fieldObj, symbols))
  }
  return fields
}

/** The set of collection keys that are handled by dedicated parsers (not captured in `options`). */
const COLLECTION_RESERVED_KEYS = new Set(['access', 'fields', 'hooks', 'slug'])

function collectCollections(
  configArg: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedCollection[] {
  const collectionsProp = getProp(configArg, 'collections')
  if (!collectionsProp) {
    return []
  }
  const arr = resolveToArrayLiteral(collectionsProp, symbols)
  if (!arr) {
    return []
  }
  const collections: ParsedCollection[] = []
  for (const element of arr.elements) {
    const collObj = resolveToObjectLiteral(element, symbols)
    if (!collObj) {
      continue
    }
    // Capture collection-level options: every key except the reserved ones.
    const options: Record<string, ts.Expression> = {}
    for (const prop of collObj.properties) {
      if (
        ts.isPropertyAssignment(prop) &&
        ts.isIdentifier(prop.name) &&
        !COLLECTION_RESERVED_KEYS.has(prop.name.text)
      ) {
        options[prop.name.text] = prop.initializer
      }
    }
    collections.push({
      slug: getString(getProp(collObj, 'slug')),
      access: collectAccess(collObj, symbols),
      fields: collectFieldsFrom(collObj, symbols),
      hooks: collectHooks(collObj, symbols),
      options,
    })
  }
  return collections
}

function collectConfigOptions(
  configArg: ts.ObjectLiteralExpression,
): Record<string, ts.Expression> {
  const out: Record<string, ts.Expression> = {}
  for (const prop of configArg.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      out[prop.name.text] = prop.initializer
    } else if (ts.isShorthandPropertyAssignment(prop)) {
      // e.g. buildConfig({ csrf }) where csrf is a top-level const
      // Use the name identifier as the expression so the symbols map can resolve it
      out[prop.name.text] = prop.name
    }
  }
  return out
}

/** Maps adapter function names to their short discriminator strings. */
const ADAPTER_NAME_MAP: Record<string, AdapterName> = {
  d1SqliteAdapter: 'd1-sqlite',
  mongooseAdapter: 'mongoose',
  postgresAdapter: 'postgres',
  sqliteAdapter: 'sqlite',
  vercelPostgresAdapter: 'vercel-postgres',
}

function collectDbAdapter(
  configArg: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedConfig['db'] {
  const dbProp = getProp(configArg, 'db')
  if (!dbProp) {
    return undefined
  }
  const expr = unwrap(dbProp)
  // db value must be a call expression like postgresAdapter({ ... })
  if (!ts.isCallExpression(expr)) {
    return undefined
  }
  const callee = unwrap(expr.expression)
  const calleeName = ts.isIdentifier(callee) ? callee.text : undefined
  const adapter = calleeName ? (ADAPTER_NAME_MAP[calleeName] ?? '<unknown>') : '<unknown>'

  // Extract options from the first argument object
  const options: Record<string, ts.Expression> = {}
  if (expr.arguments.length > 0) {
    const argsObj = resolveToObjectLiteral(expr.arguments[0]!, symbols)
    if (argsObj) {
      for (const prop of argsObj.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          options[prop.name.text] = prop.initializer
        }
      }
    }
  }
  return { adapter, options }
}

function collectJobs(
  configArg: ts.ObjectLiteralExpression,
  symbols: Map<string, ts.Expression>,
): ParsedConfig['jobs'] {
  const jobsProp = getProp(configArg, 'jobs')
  if (!jobsProp) {
    return undefined
  }
  const jobsObj = resolveToObjectLiteral(jobsProp, symbols)
  if (!jobsObj) {
    return undefined
  }

  // Collect tasks
  const tasks: Array<{ slug?: string }> = []
  const tasksProp = getProp(jobsObj, 'tasks')
  if (tasksProp) {
    const arr = resolveToArrayLiteral(tasksProp, symbols)
    if (arr) {
      for (const element of arr.elements) {
        const taskObj = resolveToObjectLiteral(element, symbols)
        if (taskObj) {
          tasks.push({ slug: getString(getProp(taskObj, 'slug')) })
        }
      }
    }
  }

  // Collect workflows
  const workflows: Array<{ slug?: string }> = []
  const workflowsProp = getProp(jobsObj, 'workflows')
  if (workflowsProp) {
    const arr = resolveToArrayLiteral(workflowsProp, symbols)
    if (arr) {
      for (const element of arr.elements) {
        const wfObj = resolveToObjectLiteral(element, symbols)
        if (wfObj) {
          workflows.push({ slug: getString(getProp(wfObj, 'slug')) })
        }
      }
    }
  }

  // Collect other jobs options (e.g. autoRun)
  const options: Record<string, ts.Expression> = {}
  for (const prop of jobsObj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text !== 'tasks' &&
      prop.name.text !== 'workflows'
    ) {
      options[prop.name.text] = prop.initializer
    }
  }

  return { options, tasks, workflows }
}

/**
 * Returns the literal value of an expression when it is a primitive literal,
 * or undefined for anything else (function calls, references, etc.). Used by
 * the `fieldOption` assertion to compare expected primitive values.
 */
export function literalValue(
  node: ts.Expression | undefined,
): boolean | number | string | undefined {
  if (!node) {
    return undefined
  }
  const u = unwrap(node)
  if (ts.isStringLiteral(u) || ts.isNoSubstitutionTemplateLiteral(u)) {
    return u.text
  }
  if (u.kind === ts.SyntaxKind.TrueKeyword) {
    return true
  }
  if (u.kind === ts.SyntaxKind.FalseKeyword) {
    return false
  }
  if (ts.isNumericLiteral(u)) {
    return Number(u.text)
  }
  return undefined
}
