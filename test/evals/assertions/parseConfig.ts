import ts from 'typescript'

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
  slug?: string
}

export type ParsedConfig = {
  collections: ParsedCollection[]
}

/**
 * Parses an LLM-generated payload.config.ts source string into a structural
 * model focused on what the assertion DSL needs (collection slugs, fields,
 * hooks at each level, access functions, block definitions). Resolves
 * top-level identifier references so configs that pull collections out into
 * named consts work.
 */
export function parseConfig(source: string): ParsedConfig {
  const sourceFile = ts.createSourceFile('config.ts', source, ts.ScriptTarget.Latest, true)
  const symbols = collectTopLevelSymbols(sourceFile)

  const buildConfigCall = findBuildConfigCall(sourceFile)
  if (!buildConfigCall || buildConfigCall.arguments.length === 0) {
    return { collections: [] }
  }

  const configArg = resolveToObjectLiteral(buildConfigCall.arguments[0]!, symbols)
  if (!configArg) {
    return { collections: [] }
  }

  return { collections: collectCollections(configArg, symbols) }
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

function resolveToObjectLiteral(
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
      fields: collectFieldsFrom(blockObj, symbols),
      slug: getString(getProp(blockObj, 'slug')),
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
    hooks: collectHooks(fieldObj, symbols),
    name: getString(getProp(fieldObj, 'name')),
    options: collectFieldOptions(fieldObj),
    type,
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
    collections.push({
      access: collectAccess(collObj, symbols),
      fields: collectFieldsFrom(collObj, symbols),
      hooks: collectHooks(collObj, symbols),
      slug: getString(getProp(collObj, 'slug')),
    })
  }
  return collections
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
