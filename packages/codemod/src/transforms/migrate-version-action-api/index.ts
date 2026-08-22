import type {
  CallExpression,
  Node as MorphNode,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

type OperationKind = 'create' | 'read' | 'restore' | 'update'

type StaticStatus = 'computed' | 'draft' | 'localized' | 'published'

const READ_METHODS = new Set(['count', 'find', 'findByID', 'findDistinct', 'findGlobal', 'findOne'])

const CREATE_METHODS = new Set(['create', 'duplicate'])

const UPDATE_METHODS = new Set(['update', 'updateGlobal'])

const RESTORE_METHODS = new Set(['restoreGlobalVersion', 'restoreVersion'])

export const migrateVersionActionApi: Transform = {
  name: 'migrate-version-action-api',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath()
      let mutated = false

      if (rewriteCallOptions({ filePath, notes, sourceFile })) {
        mutated = true
      }

      if (rewriteStrictDraftTypes({ filePath, notes, sourceFile })) {
        mutated = true
      }

      if (rewriteStringDrafts({ filePath, notes, sourceFile })) {
        mutated = true
      }

      noteUnhandledDraftOptions({ filePath, notes, sourceFile })

      if (mutated) {
        filesChanged.add(filePath)
      }
    }

    return {
      filesChanged: [...filesChanged],
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Rewrites leftover `draft` operation options to `version` on reads and `action` on writes, removes `typescript.strictDraftTypes`, and rewrites unambiguous REST/GraphQL `draft` arguments. Emits notes for update `draft: false` without static `_status`, dynamic values, detached options, wrappers, conflicts, ambiguous strings/URLs, localized/computed `_status`, and `strictDraftTypes: false`.',
}

function rewriteCallOptions({
  filePath,
  notes,
  sourceFile,
}: {
  filePath: string
  notes: string[]
  sourceFile: SourceFile
}): boolean {
  let mutated = false

  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const kind = getOperationKind(call)
    const options = getOptionsObject(call)

    if (!kind) {
      if (options && hasDraftProperty(options) && looksLikeOperationOptions(options)) {
        notes.push(
          `${filePath}: wrapper or unclassified call with \`draft\` could not be mapped — set \`version\` or \`action\` at the Payload operation call site.`,
        )
      }
      continue
    }

    if (!options) {
      continue
    }

    if (rewriteOptionsObject({ filePath, kind, notes, options })) {
      mutated = true
    }
  }

  return mutated
}

function rewriteOptionsObject({
  filePath,
  kind,
  notes,
  options,
}: {
  filePath: string
  kind: OperationKind
  notes: string[]
  options: ObjectLiteralExpression
}): boolean {
  const draftProp = getNamedPropertyAssignment(options, 'draft')
  if (!draftProp) {
    const shorthand = options.getProperty('draft')
    if (shorthand && Node.isShorthandPropertyAssignment(shorthand)) {
      notes.push(
        `${filePath}: dynamic \`draft\` value cannot be rewritten safely — replace it with \`version\` or \`action\` manually.`,
      )
    }
    return false
  }

  const draftValue = getStaticBoolean(draftProp.getInitializer())
  if (draftValue === undefined) {
    notes.push(
      `${filePath}: dynamic \`draft\` value cannot be rewritten safely — replace it with \`version\` or \`action\` manually.`,
    )
    return false
  }

  if (options.getProperty('version') || options.getProperty('action')) {
    notes.push(
      `${filePath}: conflicting \`draft\` and \`version\`/\`action\` values — resolve the operation intent manually.`,
    )
    return false
  }

  const status = getDataStatus(options)

  if (status === 'localized' || status === 'computed') {
    notes.push(
      `${filePath}: localized or computed \`_status\` combined with \`draft\` — set \`action\` explicitly and keep \`_status\` in write data.`,
    )
    return false
  }

  if (kind === 'read') {
    draftProp.set({
      name: 'version',
      initializer: draftValue ? "'latest'" : "'published'",
    })
    return true
  }

  if (kind === 'restore') {
    draftProp.set({
      name: 'action',
      initializer: draftValue ? "'saveDraft'" : "'publish'",
    })
    return true
  }

  if (!draftValue && kind === 'update' && status === undefined) {
    notes.push(
      `${filePath}: update \`draft: false\` without a static \`_status\` depends on existing document state — set \`action: 'publish'\` or \`action: 'saveDraft'\` explicitly.`,
    )
    return false
  }

  const inferredFromStatus =
    status === 'draft' ? 'saveDraft' : status === 'published' ? 'publish' : undefined
  const mappedAction = draftValue ? 'saveDraft' : 'publish'

  if (inferredFromStatus && inferredFromStatus !== mappedAction) {
    notes.push(
      `${filePath}: conflicting \`draft\` and \`_status\` values — set \`action\` explicitly and keep \`_status\` in write data.`,
    )
    return false
  }

  if (inferredFromStatus === mappedAction) {
    draftProp.remove()
    return true
  }

  draftProp.set({
    name: 'action',
    initializer: `'${mappedAction}'`,
  })
  return true
}

function rewriteStrictDraftTypes({
  filePath,
  notes,
  sourceFile,
}: {
  filePath: string
  notes: string[]
  sourceFile: SourceFile
}): boolean {
  let mutated = false

  for (const prop of [...sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment)]) {
    if (prop.wasForgotten() || prop.getName() !== 'strictDraftTypes') {
      continue
    }

    const parent = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
    const typescriptProp = parent?.getParent()
    if (
      !parent ||
      !Node.isPropertyAssignment(typescriptProp) ||
      typescriptProp.getName() !== 'typescript'
    ) {
      continue
    }

    const wasFalse = getStaticBoolean(prop.getInitializer()) === false

    prop.remove()
    mutated = true

    if (wasFalse) {
      notes.push(
        `${filePath}: removed \`strictDraftTypes: false\`; Local API and SDK types are now always strict.`,
      )
    }

    if (parent && !parent.wasForgotten() && parent.getProperties().length === 0) {
      const typescriptProp = parent.getParent()
      if (Node.isPropertyAssignment(typescriptProp) && typescriptProp.getName() === 'typescript') {
        typescriptProp.remove()
      }
    }
  }

  return mutated
}

function rewriteStringDrafts({
  filePath,
  notes,
  sourceFile,
}: {
  filePath: string
  notes: string[]
  sourceFile: SourceFile
}): boolean {
  let mutated = false
  const handled = new Set<MorphNode>()

  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const method = getCallMethodName(call)
    if (method !== 'fetch') {
      continue
    }

    const urlArg = call.getArguments()[0]
    if (!urlArg || !isStringLike(urlArg)) {
      continue
    }

    const fetchKind = getFetchOperationKind(call)
    const rewritten = rewriteQueryDraft(urlArg.getText(), fetchKind)

    if (rewritten.note) {
      notes.push(`${filePath}: ${rewritten.note}`)
    }

    if (rewritten.text && rewritten.text !== urlArg.getText()) {
      urlArg.replaceWithText(rewritten.text)
      mutated = true
    }

    handled.add(urlArg)
  }

  for (const literal of [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ]) {
    if (handled.has(literal) || literal.wasForgotten()) {
      continue
    }

    const original = literal.getText()
    const graphqlRewritten = rewriteGraphqlDraftArgs(original)

    if (graphqlRewritten.changed) {
      literal.replaceWithText(graphqlRewritten.text)
      mutated = true
      continue
    }

    if (graphqlRewritten.ambiguous) {
      notes.push(
        `${filePath}: GraphQL \`draft\` argument without enough operation context — replace with \`version\` or \`action\` manually.`,
      )
      continue
    }

    const body = Node.isStringLiteral(literal) ? literal.getLiteralText() : literal.getLiteralText()

    if (hasDynamicDraftQuery(body) || hasDynamicGraphqlDraft(body)) {
      notes.push(
        `${filePath}: dynamic \`draft\` value cannot be rewritten safely — replace it with \`version\` or \`action\` manually.`,
      )
      continue
    }

    if (hasDraftQueryParam(body)) {
      notes.push(
        `${filePath}: REST \`draft\` query without enough operation context — replace with \`version\` or \`action\` manually.`,
      )
    }
  }

  for (const tagged of sourceFile.getDescendantsOfKind(SyntaxKind.TaggedTemplateExpression)) {
    const tag = tagged.getTag()
    const tagName = tag.getText()
    if (tagName !== 'gql' && tagName !== 'graphql' && !tagName.endsWith('.gql')) {
      continue
    }

    const template = tagged.getTemplate()
    const original = template.getText()
    const graphqlRewritten = rewriteGraphqlDraftArgs(original)

    if (graphqlRewritten.changed) {
      template.replaceWithText(graphqlRewritten.text)
      mutated = true
    } else if (graphqlRewritten.ambiguous) {
      notes.push(
        `${filePath}: GraphQL \`draft\` argument without enough operation context — replace with \`version\` or \`action\` manually.`,
      )
    }
  }

  return mutated
}

function noteUnhandledDraftOptions({
  filePath,
  notes,
  sourceFile,
}: {
  filePath: string
  notes: string[]
  sourceFile: SourceFile
}): void {
  for (const prop of sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment)) {
    if (prop.getName() !== 'draft') {
      continue
    }

    const parent = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
    if (!parent || isInsideDataProperty(prop) || isCallOptionsObject(parent)) {
      continue
    }

    if (looksLikeOperationOptions(parent)) {
      notes.push(
        `${filePath}: detached options object with \`draft\` is not at a Payload call site — inline it or set \`version\`/\`action\` on the call.`,
      )
    }
  }
}

function getOperationKind(call: CallExpression): OperationKind | undefined {
  const methodName = getCallMethodName(call)
  if (!methodName) {
    return undefined
  }

  if (READ_METHODS.has(methodName)) {
    return 'read'
  }
  if (CREATE_METHODS.has(methodName)) {
    return 'create'
  }
  if (UPDATE_METHODS.has(methodName)) {
    return 'update'
  }
  if (RESTORE_METHODS.has(methodName)) {
    return 'restore'
  }

  return undefined
}

function getCallMethodName(call: CallExpression): string | undefined {
  const expr = call.getExpression()

  if (Node.isPropertyAccessExpression(expr)) {
    return expr.getName()
  }

  if (Node.isIdentifier(expr)) {
    return expr.getText()
  }

  return undefined
}

function getOptionsObject(call: CallExpression): ObjectLiteralExpression | undefined {
  const firstArg = call.getArguments()[0]
  if (!firstArg || !Node.isObjectLiteralExpression(firstArg)) {
    return undefined
  }
  return firstArg
}

function getNamedPropertyAssignment(
  obj: ObjectLiteralExpression,
  name: string,
): PropertyAssignment | undefined {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) {
    return undefined
  }
  return prop
}

function hasDraftProperty(obj: ObjectLiteralExpression): boolean {
  return obj.getProperty('draft') !== undefined
}

function looksLikeOperationOptions(obj: ObjectLiteralExpression): boolean {
  if (obj.getProperty('collection')) {
    return true
  }

  if (obj.getProperty('slug') && !obj.getProperty('fields')) {
    return Boolean(obj.getProperty('data') || obj.getProperty('depth') || obj.getProperty('where'))
  }

  return false
}

function isCallOptionsObject(obj: ObjectLiteralExpression): boolean {
  const parent = obj.getParent()
  return Node.isCallExpression(parent) && parent.getArguments()[0] === obj
}

function isInsideDataProperty(prop: PropertyAssignment): boolean {
  let current: MorphNode | undefined = prop.getParent()

  while (current) {
    if (Node.isPropertyAssignment(current) && current.getName() === 'data') {
      return true
    }
    current = current.getParent()
  }

  return false
}

function getDataStatus(options: ObjectLiteralExpression): StaticStatus | undefined {
  const dataProp = getNamedPropertyAssignment(options, 'data')
  if (!dataProp) {
    return undefined
  }

  const dataInit = unwrap(dataProp.getInitializer())
  if (!dataInit) {
    return undefined
  }

  if (Node.isIdentifier(dataInit)) {
    return 'computed'
  }

  if (!Node.isObjectLiteralExpression(dataInit)) {
    return 'computed'
  }

  const statusProp = getNamedPropertyAssignment(dataInit, '_status')
  if (!statusProp) {
    return undefined
  }

  const statusInit = unwrap(statusProp.getInitializer())
  if (!statusInit) {
    return 'computed'
  }

  if (Node.isStringLiteral(statusInit) || Node.isNoSubstitutionTemplateLiteral(statusInit)) {
    const value = statusInit.getLiteralValue()
    if (value === 'draft' || value === 'published') {
      return value
    }
    return 'computed'
  }

  if (Node.isObjectLiteralExpression(statusInit)) {
    return 'localized'
  }

  return 'computed'
}

function getStaticBoolean(node: MorphNode | undefined): boolean | undefined {
  if (!node) {
    return undefined
  }

  const inner = unwrap(node)
  if (!inner) {
    return undefined
  }
  if (inner.getKind() === SyntaxKind.TrueKeyword) {
    return true
  }
  if (inner.getKind() === SyntaxKind.FalseKeyword) {
    return false
  }

  return undefined
}

function unwrap(node: MorphNode | undefined): MorphNode | undefined {
  if (!node) {
    return undefined
  }

  let current = node

  while (
    Node.isAsExpression(current) ||
    Node.isParenthesizedExpression(current) ||
    Node.isSatisfiesExpression(current)
  ) {
    current = current.getExpression()
  }

  return current
}

function getFetchOperationKind(call: CallExpression): OperationKind {
  const initArg = call.getArguments()[1]
  const method = getFetchMethod(initArg)

  if (method === 'POST') {
    const urlText = call.getArguments()[0]?.getText() ?? ''
    if (/restore/i.test(urlText)) {
      return 'restore'
    }
    return 'create'
  }

  if (method === 'PATCH' || method === 'PUT') {
    return 'update'
  }

  return 'read'
}

function getFetchMethod(initArg: MorphNode | undefined): string | undefined {
  if (!initArg || !Node.isObjectLiteralExpression(initArg)) {
    return undefined
  }

  const methodProp = getNamedPropertyAssignment(initArg, 'method')
  const value = methodProp?.getInitializer()
  if (!value || !(Node.isStringLiteral(value) || Node.isNoSubstitutionTemplateLiteral(value))) {
    return undefined
  }

  return value.getLiteralValue().toUpperCase()
}

function isStringLike(node: MorphNode): boolean {
  return (
    Node.isStringLiteral(node) ||
    Node.isNoSubstitutionTemplateLiteral(node) ||
    Node.isTemplateExpression(node)
  )
}

function rewriteQueryDraft(text: string, kind: OperationKind): { note?: string; text: string } {
  if (hasDynamicDraftQuery(text)) {
    return {
      note: 'dynamic `draft` query cannot be rewritten safely — replace it with `version` or `action` manually.',
      text,
    }
  }

  if (!/\bdraft=(?:true|false)\b/.test(text)) {
    return { text }
  }

  if (kind === 'read') {
    return {
      text: text
        .replace(/\bdraft=true\b/g, 'version=latest')
        .replace(/\bdraft=false\b/g, 'version=published'),
    }
  }

  if (kind === 'update') {
    if (/\bdraft=false\b/.test(text) && !/\b_status=published\b/.test(text)) {
      return {
        note: 'update `draft=false` REST query without a static `_status` depends on existing document state — set `action=publish` or `action=saveDraft` explicitly.',
        text,
      }
    }
  }

  return {
    text: text
      .replace(/\bdraft=true\b/g, 'action=saveDraft')
      .replace(/\bdraft=false\b/g, 'action=publish'),
  }
}

function rewriteGraphqlDraftArgs(text: string): {
  ambiguous: boolean
  changed: boolean
  text: string
} {
  if (hasDynamicGraphqlDraft(text) && /[({]/.test(text)) {
    return { ambiguous: true, changed: false, text }
  }

  if (!/\bdraft:\s*(?:true|false)\b/.test(text)) {
    return { ambiguous: false, changed: false, text }
  }

  let changed = false
  let ambiguous = false
  const next = text.replace(
    /\bdraft:\s*(true|false)\b/g,
    (match, value: string, offset: number) => {
      const enclosing = enclosingBracket({ offset, text })
      if (enclosing !== '(') {
        return match
      }

      const fieldName = graphqlFieldNameBefore({ offset, text })
      const operation = graphqlOperationBefore({ offset, text })
      const boolValue = value === 'true'

      if (operation === 'mutation') {
        if (!fieldName) {
          ambiguous = true
          return match
        }

        if (/^restore/i.test(fieldName)) {
          changed = true
          return `action: ${boolValue ? 'saveDraft' : 'publish'}`
        }

        if (/^(?:create|duplicate)/i.test(fieldName)) {
          changed = true
          return `action: ${boolValue ? 'saveDraft' : 'publish'}`
        }

        if (/^update/i.test(fieldName)) {
          if (!boolValue) {
            ambiguous = true
            return match
          }
          changed = true
          return `action: saveDraft`
        }

        ambiguous = true
        return match
      }

      if (operation === 'query' || operation === 'subscription') {
        changed = true
        return `version: ${boolValue ? 'latest' : 'published'}`
      }

      ambiguous = true
      return match
    },
  )

  return { ambiguous, changed, text: next }
}

function enclosingBracket({
  offset,
  text,
}: {
  offset: number
  text: string
}): '(' | '{' | undefined {
  const stack: Array<'(' | '{'> = []

  for (let i = 0; i < offset; i++) {
    const char = text[i]
    if (char === '(' || char === '{') {
      stack.push(char)
    } else if (char === ')' || char === '}') {
      stack.pop()
    }
  }

  return stack.at(-1)
}

function graphqlFieldNameBefore({
  offset,
  text,
}: {
  offset: number
  text: string
}): string | undefined {
  const before = text.slice(0, offset)
  const openParen = before.lastIndexOf('(')
  if (openParen === -1) {
    return undefined
  }

  const nameMatch = before.slice(0, openParen).match(/([A-Z_]\w*)\s*$/i)
  return nameMatch?.[1]
}

function graphqlOperationBefore({
  offset,
  text,
}: {
  offset: number
  text: string
}): 'mutation' | 'query' | 'subscription' | undefined {
  const before = text.slice(0, offset)
  if (/\bmutation\b/.test(before)) {
    return 'mutation'
  }
  if (/\bsubscription\b/.test(before)) {
    return 'subscription'
  }
  if (/\bquery\b/.test(before)) {
    return 'query'
  }
  return undefined
}

function hasDraftQueryParam(value: string): boolean {
  return /\bdraft=(?:true|false)\b/.test(value)
}

function hasDynamicDraftQuery(value: string): boolean {
  return /\bdraft=(?!true\b|false\b)/.test(value) || /\bdraft=\$\{/.test(value)
}

function hasDynamicGraphqlDraft(value: string): boolean {
  return /\bdraft:\s*(?!true\b|false\b)[^\s,)]+/.test(value)
}
