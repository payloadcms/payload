import type {
  CallExpression,
  Node as MorphNode,
  ObjectLiteralExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SourceFile,
} from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

type OperationKind = 'create' | 'read' | 'restore' | 'update'

type StaticStatus = 'computed' | 'draft' | 'localized' | 'published'

type PublicationAction = 'publish' | 'unpublish'

type AbsentWriteLocaleSource = 'default' | 'inherited'

type GraphqlArgument = {
  name: string
  nameStart: number
  valueEnd: number
  valueStart: number
}

type GraphqlFieldArguments = {
  argsEnd: number
  argsStart: number
  fieldName: string
  fieldStart: number
}

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

      if (rewriteAllLocaleStrings({ filePath, notes, sourceFile })) {
        mutated = true
      }

      if (rewriteStrictDraftTypes({ filePath, notes, sourceFile })) {
        mutated = true
      }

      if (rewriteStringDrafts({ filePath, notes, sourceFile })) {
        mutated = true
      }

      noteUnhandledDraftOptions({ filePath, notes, sourceFile })
      noteUnhandledAllLocaleOptions({ filePath, notes, sourceFile })

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
    "Rewrites leftover `draft` operation options to `version` on reads and `action` on writes, replaces static all-locale publication flags with `locale: 'all'`, removes `typescript.strictDraftTypes`, and rewrites unambiguous REST/GraphQL arguments. Emits notes for dynamic values, detached options, wrappers, conflicts, ambiguous strings/URLs, localized/computed `_status`, and `strictDraftTypes: false`.",
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
      if (options && hasAllLocaleProperty(options) && looksLikeOperationOptions(options)) {
        notes.push(
          `${filePath}: wrapper or unclassified call with all-locale publication flags could not be mapped — set an explicit publication \`action\` and \`locale\` at the Payload operation call site.`,
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

    if (rewriteAllLocaleOptionsObject({ filePath, kind, notes, options })) {
      mutated = true
    }
  }

  return mutated
}

function rewriteAllLocaleOptionsObject({
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
  const flagProperties = getAllLocaleProperties(options)
  if (flagProperties.length === 0) {
    return false
  }

  if (hasUnresolvedObjectOverride(options)) {
    notes.push(
      `${filePath}: spread or computed property can override all-locale publication options — set an explicit publication \`action\` and \`locale\` manually.`,
    )
    return false
  }

  let mutated = false
  let hasDynamicFlag = false
  const activeFlags: Array<{
    action: PublicationAction
    name: string
    property: PropertyAssignment
  }> = []

  for (const { name, action, property } of flagProperties) {
    if (!Node.isPropertyAssignment(property)) {
      hasDynamicFlag = true
      notes.push(
        `${filePath}: dynamic \`${name}\` value cannot be rewritten safely — use an explicit publication \`action\` and \`locale\` manually.`,
      )
      continue
    }

    const value = getStaticBoolean(property.getInitializer())

    if (value === false) {
      property.remove()
      mutated = true
      continue
    }

    if (value === undefined) {
      hasDynamicFlag = true
      notes.push(
        `${filePath}: dynamic \`${name}\` value cannot be rewritten safely — use an explicit publication \`action\` and \`locale\` manually.`,
      )
      continue
    }

    activeFlags.push({ name, action, property })
  }

  if (activeFlags.length > 1) {
    notes.push(
      `${filePath}: conflicting all-locale publication flags — choose an explicit \`publish\` or \`unpublish\` action with \`locale: 'all'\` manually.`,
    )
    return mutated
  }

  if (hasDynamicFlag) {
    return mutated
  }

  const activeFlag = activeFlags[0]
  if (!activeFlag) {
    return mutated
  }

  if (
    kind === 'read' ||
    kind === 'restore' ||
    (activeFlag.action === 'unpublish' && kind === 'create')
  ) {
    notes.push(
      `${filePath}: \`${activeFlag.name}\` is not valid for the detected operation — set an explicit publication \`action\` and \`locale\` manually.`,
    )
    return mutated
  }

  const actionProperty = options.getProperty('action')
  const actionAssignment = getNamedPropertyAssignment(options, 'action')
  const action = getStaticString(actionAssignment?.getInitializer())

  if (actionProperty && action === undefined) {
    notes.push(
      `${filePath}: dynamic \`action\` combined with \`${activeFlag.name}\` cannot be rewritten safely — set the publication action and \`locale: 'all'\` manually.`,
    )
    return mutated
  }

  if (action && action !== activeFlag.action) {
    notes.push(
      `${filePath}: conflicting \`action\` and \`${activeFlag.name}\` values — choose an explicit publication action with \`locale: 'all'\` manually.`,
    )
    return mutated
  }

  const localeProperty = options.getProperty('locale')
  const localeAssignment = getNamedPropertyAssignment(options, 'locale')
  const locale = getStaticString(localeAssignment?.getInitializer())

  if (localeProperty && locale === undefined) {
    notes.push(
      `${filePath}: dynamic \`locale\` combined with \`${activeFlag.name}\` cannot be rewritten safely — set the publication action and locale manually.`,
    )
    return mutated
  }

  if (!actionProperty) {
    notes.push(
      `${filePath}: \`${activeFlag.name}\` requires an explicit \`${activeFlag.action}\` action with \`locale: 'all'\` — add both manually.`,
    )
    return mutated
  }

  if (
    !isWriteLocalePreserved({
      absentLocaleSource: options.getProperty('req') ? 'inherited' : 'default',
      hasPotentialWriteData: hasPotentialWriteData(options),
      locale,
    })
  ) {
    notes.push(
      `${filePath}: non-empty or unresolved \`data\` with \`${activeFlag.name}\` cannot be rewritten safely because the write locale is not provably preserved — keep the localized data write and perform the all-locale publication as a separate operation manually.`,
    )
    return mutated
  }

  if (localeAssignment) {
    localeAssignment.setInitializer("'all'")
    activeFlag.property.remove()
  } else {
    activeFlag.property.set({
      name: 'locale',
      initializer: "'all'",
    })
  }

  return true
}

function hasPotentialWriteData(options: ObjectLiteralExpression): boolean {
  const dataProperty = getNamedPropertyAssignment(options, 'data')
  if (!dataProperty) {
    return options.getProperty('data') !== undefined
  }

  const data = unwrap(dataProperty.getInitializer())
  return !Node.isObjectLiteralExpression(data) || data.getProperties().length > 0
}

function isWriteLocalePreserved({
  absentLocaleSource,
  hasPotentialWriteData,
  locale,
}: {
  absentLocaleSource: AbsentWriteLocaleSource
  hasPotentialWriteData: boolean
  locale: string | undefined
}): boolean {
  if (!hasPotentialWriteData || locale === 'all') {
    return true
  }

  if (locale !== undefined) {
    return false
  }

  return absentLocaleSource === 'default'
}

function hasUnresolvedObjectOverride(options: ObjectLiteralExpression): boolean {
  return options.getProperties().some((property) => {
    if (Node.isSpreadAssignment(property)) {
      return true
    }

    return (
      Node.isPropertyAssignment(property) &&
      property.getNameNode().getKind() === SyntaxKind.ComputedPropertyName
    )
  })
}

function getAllLocaleProperties(options: ObjectLiteralExpression): Array<{
  action: PublicationAction
  name: string
  property: PropertyAssignment | ShorthandPropertyAssignment
}> {
  const properties: Array<{
    action: PublicationAction
    name: string
    property: PropertyAssignment | ShorthandPropertyAssignment
  }> = []

  for (const [name, action] of [
    ['publishAllLocales', 'publish'],
    ['unpublishAllLocales', 'unpublish'],
  ] as const) {
    const property = getNamedPropertyAssignment(options, name)
    if (property) {
      properties.push({ name, action, property })
      continue
    }

    const shorthand = options.getProperty(name)
    if (shorthand && Node.isShorthandPropertyAssignment(shorthand)) {
      properties.push({ name, action, property: shorthand })
    }
  }

  return properties
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

    if (!isPayloadRestUrl({ node: urlArg })) {
      const urlText = getStringLikeText({ node: urlArg })
      if (hasDynamicDraftQuery(urlText)) {
        notes.push(
          `${filePath}: dynamic \`draft\` query cannot be rewritten safely — replace it with \`version\` or \`action\` manually.`,
        )
      } else if (hasDraftQueryParam(urlText)) {
        notes.push(
          `${filePath}: REST \`draft\` query without enough operation context — replace with \`version\` or \`action\` manually.`,
        )
      }
      handled.add(urlArg)
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

    if (isPayloadGraphqlUrl({ node: urlArg })) {
      const initArg = call.getArguments()[1]
      if (initArg) {
        for (const literal of getStringLikeDescendants({ node: initArg })) {
          const rewrittenGraphql = rewriteGraphqlDraftArgs(literal.getText())
          if (rewrittenGraphql.changed) {
            literal.replaceWithText(rewrittenGraphql.text)
            mutated = true
          } else if (rewrittenGraphql.ambiguous) {
            notes.push(
              `${filePath}: GraphQL \`draft\` argument without enough operation context — replace with \`version\` or \`action\` manually.`,
            )
          }
          handled.add(literal)
        }
      }
    }
  }

  for (const literal of [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ]) {
    if (handled.has(literal) || literal.wasForgotten()) {
      continue
    }

    if (Node.isTaggedTemplateExpression(literal.getParent())) {
      continue
    }

    const original = literal.getText()
    const graphqlRewritten = rewriteGraphqlDraftArgs(original)

    if (graphqlRewritten.changed || graphqlRewritten.ambiguous) {
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

    if (graphqlRewritten.changed || graphqlRewritten.ambiguous) {
      notes.push(
        `${filePath}: GraphQL \`draft\` argument without enough operation context — replace with \`version\` or \`action\` manually.`,
      )
    }
  }

  return mutated
}

function rewriteAllLocaleStrings({
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
    if (getCallMethodName(call) !== 'fetch') {
      continue
    }

    const urlArg = call.getArguments()[0]
    if (!urlArg || !isStringLike(urlArg)) {
      continue
    }

    if (!isPayloadRestUrl({ node: urlArg })) {
      if (hasAllLocaleQueryParam(getStringLikeText({ node: urlArg }))) {
        notes.push(
          `${filePath}: REST all-locale publication query without enough operation context — replace it with an explicit publication \`action\` and \`locale=all\` manually.`,
        )
      }
      handled.add(urlArg)
      continue
    }

    const rewritten = rewriteAllLocaleQuery(
      urlArg.getText(),
      getFetchOperationKind(call),
      hasPotentialFetchWriteBody(call),
    )

    if (rewritten.note) {
      notes.push(`${filePath}: ${rewritten.note}`)
    }

    if (rewritten.text !== urlArg.getText()) {
      urlArg.replaceWithText(rewritten.text)
      mutated = true
    }

    handled.add(urlArg)

    if (isPayloadGraphqlUrl({ node: urlArg })) {
      const initArg = call.getArguments()[1]
      if (initArg) {
        for (const literal of getStringLikeDescendants({ node: initArg })) {
          const rewrittenGraphql = rewriteGraphqlAllLocaleArgs(getGraphqlStringText(literal))
          if (rewrittenGraphql.changed) {
            if (Node.isStringLiteral(literal)) {
              if (literal.getText().startsWith('"')) {
                literal.replaceWithText(JSON.stringify(rewrittenGraphql.text))
              } else {
                literal.setLiteralValue(rewrittenGraphql.text)
              }
            } else {
              literal.replaceWithText(rewrittenGraphql.text)
            }
            mutated = true
          }
          if (rewrittenGraphql.ambiguous) {
            notes.push(
              rewrittenGraphql.unsafeWriteLocale
                ? `${filePath}: non-empty or unresolved \`data\` with an all-locale publication flag cannot be rewritten safely because the write locale is not provably preserved — keep the localized data write and perform the all-locale publication as a separate operation manually.`
                : `${filePath}: GraphQL all-locale publication argument could not be rewritten safely — use an explicit publication \`action\` and \`locale: all\` manually.`,
            )
          }
          handled.add(literal)
        }
      }
    }
  }

  for (const literal of [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ]) {
    if (handled.has(literal) || literal.wasForgotten()) {
      continue
    }

    if (Node.isTaggedTemplateExpression(literal.getParent())) {
      continue
    }

    const rewrittenGraphql = rewriteGraphqlAllLocaleArgs(getGraphqlStringText(literal))
    if (rewrittenGraphql.changed || rewrittenGraphql.ambiguous) {
      notes.push(
        `${filePath}: GraphQL all-locale publication argument without enough operation context — replace it with an explicit publication \`action\` and \`locale: all\` manually.`,
      )
      continue
    }

    if (hasAllLocaleQueryParam(literal.getLiteralText())) {
      notes.push(
        `${filePath}: REST all-locale publication query without enough operation context — replace it with an explicit publication \`action\` and \`locale=all\` manually.`,
      )
    }
  }

  for (const tagged of sourceFile.getDescendantsOfKind(SyntaxKind.TaggedTemplateExpression)) {
    const tagName = tagged.getTag().getText()
    if (tagName !== 'gql' && tagName !== 'graphql' && !tagName.endsWith('.gql')) {
      continue
    }

    const rewrittenGraphql = rewriteGraphqlAllLocaleArgs(tagged.getTemplate().getText())
    if (rewrittenGraphql.changed || rewrittenGraphql.ambiguous) {
      notes.push(
        `${filePath}: GraphQL all-locale publication argument without enough operation context — replace it with an explicit publication \`action\` and \`locale: all\` manually.`,
      )
    }
  }

  return mutated
}

function isPayloadRestUrl({ node }: { node: MorphNode }): boolean {
  if (!Node.isTemplateExpression(node)) {
    return false
  }

  return node
    .getTemplateSpans()
    .some((span) => isPayloadApiRouteExpression({ node: span.getExpression() }))
}

function isPayloadGraphqlUrl({ node }: { node: MorphNode }): boolean {
  if (!isPayloadRestUrl({ node })) {
    return false
  }

  const text = getStringLikeText({ node })
  return /\}\s*\/graphql(?:[/?#]|$)/.test(text)
}

function isPayloadApiRouteExpression({ node }: { node: MorphNode }): boolean {
  const apiAccess = unwrap(node) ?? node
  if (!Node.isPropertyAccessExpression(apiAccess) || apiAccess.getName() !== 'api') {
    return false
  }

  const routesAccess = unwrap(apiAccess.getExpression()) ?? apiAccess.getExpression()
  if (!Node.isPropertyAccessExpression(routesAccess) || routesAccess.getName() !== 'routes') {
    return false
  }

  const configAccess = unwrap(routesAccess.getExpression()) ?? routesAccess.getExpression()
  if (!Node.isPropertyAccessExpression(configAccess) || configAccess.getName() !== 'config') {
    return false
  }

  return isProvenPayloadReceiver({ node: configAccess.getExpression() })
}

function getStringLikeText({ node }: { node: MorphNode }): string {
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText()
  }

  return node.getText().slice(1, -1)
}

function getStringLikeDescendants({ node }: { node: MorphNode }) {
  return [
    ...node.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...node.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ]
}

function getGraphqlStringText(node: MorphNode): string {
  if (Node.isStringLiteral(node)) {
    return node.getLiteralValue()
  }

  return node.getText()
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

function noteUnhandledAllLocaleOptions({
  filePath,
  notes,
  sourceFile,
}: {
  filePath: string
  notes: string[]
  sourceFile: SourceFile
}): void {
  for (const options of sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
    if (
      !hasAllLocaleProperty(options) ||
      isInsideDataObject(options) ||
      isCallOptionsObject(options) ||
      !looksLikeOperationOptions(options)
    ) {
      continue
    }

    notes.push(
      `${filePath}: detached options object with all-locale publication flags is not at a Payload call site — inline it or set an explicit publication \`action\` and \`locale\` on the call.`,
    )
  }
}

function getOperationKind(call: CallExpression): OperationKind | undefined {
  if (!isProvenPayloadOperationCall({ call })) {
    return undefined
  }

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

function isProvenPayloadOperationCall({ call }: { call: CallExpression }): boolean {
  const expression = call.getExpression()

  if (Node.isPropertyAccessExpression(expression)) {
    return isProvenPayloadReceiver({ node: expression.getExpression() })
  }

  if (!Node.isIdentifier(expression)) {
    return false
  }

  const sourceFile = call.getSourceFile()
  const name = expression.getText()

  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const nameNode = declaration.getNameNode()
    if (!Node.isObjectBindingPattern(nameNode)) {
      continue
    }

    const binding = nameNode
      .getElements()
      .find((element) => element.getNameNode().getText() === name)
    const initializer = declaration.getInitializer()

    if (binding && initializer && isProvenPayloadReceiver({ node: initializer })) {
      return true
    }
  }

  return false
}

function isProvenPayloadReceiver({ node }: { node: MorphNode }): boolean {
  const receiver = unwrapReceiver({ node })
  if (!receiver) {
    return false
  }
  const sourceFile = receiver.getSourceFile()

  if (Node.isPropertyAccessExpression(receiver) && receiver.getName() === 'payload') {
    return isIdentifierWithPayloadType({
      allowedExports: ['PayloadRequest'],
      node: receiver.getExpression(),
    })
  }

  if (!Node.isIdentifier(receiver)) {
    return false
  }

  const name = receiver.getText()

  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    const moduleName = importDeclaration.getModuleSpecifierValue()
    const defaultImport = importDeclaration.getDefaultImport()

    if (moduleName === 'payload' && defaultImport?.getText() === name) {
      return true
    }
  }

  return (
    isIdentifierWithPayloadType({
      allowedExports: ['Payload', 'PayloadSDK'],
      node: receiver,
    }) || isIdentifierInitializedByPayloadFactory({ node: receiver })
  )
}

function isIdentifierWithPayloadType({
  allowedExports,
  node,
}: {
  allowedExports: string[]
  node: MorphNode
}): boolean {
  if (!Node.isIdentifier(node)) {
    return false
  }

  const name = node.getText()
  const sourceFile = node.getSourceFile()
  const payloadTypeNames = getImportedPayloadNames({ allowedExports, sourceFile })

  for (const parameter of sourceFile.getDescendantsOfKind(SyntaxKind.Parameter)) {
    if (
      parameter.getName() === name &&
      typeUsesPayloadName({ payloadTypeNames, typeNode: parameter.getTypeNode() })
    ) {
      return true
    }
  }

  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    if (
      declaration.getName() === name &&
      typeUsesPayloadName({ payloadTypeNames, typeNode: declaration.getTypeNode() })
    ) {
      return true
    }
  }

  return false
}

function getImportedPayloadNames({
  allowedExports,
  sourceFile,
}: {
  allowedExports: string[]
  sourceFile: SourceFile
}): Set<string> {
  const names = new Set<string>()

  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    const moduleName = importDeclaration.getModuleSpecifierValue()
    if (moduleName !== 'payload' && moduleName !== '@payloadcms/sdk') {
      continue
    }

    for (const namedImport of importDeclaration.getNamedImports()) {
      if (allowedExports.includes(namedImport.getName())) {
        names.add(namedImport.getAliasNode()?.getText() ?? namedImport.getName())
      }
    }
  }

  return names
}

function typeUsesPayloadName({
  payloadTypeNames,
  typeNode,
}: {
  payloadTypeNames: Set<string>
  typeNode: MorphNode | undefined
}): boolean {
  if (!typeNode) {
    return false
  }

  const typeText = typeNode.getText()
  return [...payloadTypeNames].some((name) => new RegExp(`\\b${name}\\b`).test(typeText))
}

function isIdentifierInitializedByPayloadFactory({ node }: { node: MorphNode }): boolean {
  if (!Node.isIdentifier(node)) {
    return false
  }

  const name = node.getText()
  const sourceFile = node.getSourceFile()
  const sdkNames = getImportedPayloadNames({ allowedExports: ['PayloadSDK'], sourceFile })
  const getPayloadNames = getImportedPayloadNames({ allowedExports: ['getPayload'], sourceFile })

  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    if (declaration.getName() !== name) {
      continue
    }

    const initializer = unwrapReceiver({ node: declaration.getInitializer() })
    if (Node.isNewExpression(initializer)) {
      return sdkNames.has(initializer.getExpression().getText())
    }

    if (Node.isCallExpression(initializer)) {
      return getPayloadNames.has(initializer.getExpression().getText())
    }
  }

  return false
}

function unwrapReceiver({ node }: { node: MorphNode | undefined }): MorphNode | undefined {
  if (!node) {
    return undefined
  }

  let current = unwrap(node) ?? node
  while (Node.isAwaitExpression(current)) {
    current = unwrap(current.getExpression()) ?? current.getExpression()
  }

  return current
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

function hasAllLocaleProperty(obj: ObjectLiteralExpression): boolean {
  return Boolean(obj.getProperty('publishAllLocales') || obj.getProperty('unpublishAllLocales'))
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

function isInsideDataObject(options: ObjectLiteralExpression): boolean {
  let current: MorphNode | undefined = options.getParent()

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

function getStaticString(node: MorphNode | undefined): string | undefined {
  const inner = unwrap(node)
  if (!inner) {
    return undefined
  }

  if (Node.isStringLiteral(inner) || Node.isNoSubstitutionTemplateLiteral(inner)) {
    return inner.getLiteralValue()
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

function hasPotentialFetchWriteBody(call: CallExpression): boolean {
  const initArg = call.getArguments()[1]
  if (!initArg || !Node.isObjectLiteralExpression(initArg)) {
    return false
  }

  if (hasUnresolvedObjectOverride(initArg)) {
    return true
  }

  const bodyProperty = getNamedPropertyAssignment(initArg, 'body')
  if (!bodyProperty) {
    return initArg.getProperty('body') !== undefined
  }

  const body = unwrap(bodyProperty.getInitializer())
  if (!body) {
    return true
  }

  if (body.getKind() === SyntaxKind.NullKeyword) {
    return false
  }

  if (Node.isStringLiteral(body) || Node.isNoSubstitutionTemplateLiteral(body)) {
    const value = body.getLiteralValue().trim()
    return value !== '' && value !== '{}'
  }

  if (Node.isCallExpression(body) && body.getExpression().getText() === 'JSON.stringify') {
    if (body.getArguments().length !== 1) {
      return true
    }

    const value = unwrap(body.getArguments()[0])
    return !Node.isObjectLiteralExpression(value) || value.getProperties().length > 0
  }

  return true
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

function rewriteAllLocaleQuery(
  text: string,
  kind: OperationKind,
  hasPotentialWriteBody: boolean,
): { note?: string; text: string } {
  const flagMatches = [...text.matchAll(/\b(publishAllLocales|unpublishAllLocales)=([^&#`'"\s]+)/g)]
  if (flagMatches.length === 0) {
    return { text }
  }

  let next = text
  const activeFlags: Array<{ action: PublicationAction; name: string }> = []

  for (const match of flagMatches) {
    const name = match[1]!
    const value = match[2]

    if (value === 'false') {
      next = removeQueryParam(next, name, 'false')
      continue
    }

    if (value !== 'true') {
      return {
        note: `dynamic \`${name}\` REST query cannot be rewritten safely — use an explicit publication \`action\` and \`locale=all\` manually.`,
        text: next,
      }
    }

    activeFlags.push({
      name,
      action: name === 'publishAllLocales' ? 'publish' : 'unpublish',
    })
  }

  if (activeFlags.length > 1) {
    return {
      note: 'conflicting all-locale publication REST query flags — choose an explicit publication `action` with `locale=all` manually.',
      text: next,
    }
  }

  const activeFlag = activeFlags[0]
  if (!activeFlag) {
    return { text: next }
  }

  if (kind === 'read' || (activeFlag.action === 'unpublish' && kind !== 'update')) {
    return {
      note: `REST \`${activeFlag.name}\` query is not valid for the detected operation — set an explicit publication \`action\` and \`locale=all\` manually.`,
      text: next,
    }
  }

  let actionMatch = next.match(/\baction=([^&#`'"\s]+)/)
  if (!actionMatch && activeFlag.action === 'publish' && /\bdraft=false\b/.test(next)) {
    next = next.replace(/\bdraft=false\b/, 'action=publish')
    actionMatch = next.match(/\baction=([^&#`'"\s]+)/)
  }
  if (!actionMatch) {
    return {
      note: `REST \`${activeFlag.name}\` requires an explicit \`action=${activeFlag.action}\` with \`locale=all\` — add both manually.`,
      text: next,
    }
  }
  if (actionMatch && actionMatch[1] !== activeFlag.action) {
    return {
      note: `conflicting REST \`action\` and \`${activeFlag.name}\` values — choose an explicit publication action with \`locale=all\` manually.`,
      text: next,
    }
  }

  const localeMatch = next.match(/\blocale=([^&#`'"\s]+)/)
  if (localeMatch?.[1]?.includes('${')) {
    return {
      note: `dynamic REST \`locale\` combined with \`${activeFlag.name}\` cannot be rewritten safely — set the publication action and locale manually.`,
      text: next,
    }
  }

  if (
    !isWriteLocalePreserved({
      absentLocaleSource: getRestAbsentLocaleSource(next),
      hasPotentialWriteData: hasPotentialWriteBody,
      locale: localeMatch?.[1],
    })
  ) {
    return {
      note: `non-empty or unresolved request body with \`${activeFlag.name}\` cannot be rewritten safely because the write locale is not provably preserved — keep the localized body write and perform the all-locale publication as a separate operation manually.`,
      text,
    }
  }

  if (localeMatch) {
    next = next.replace(/\blocale=[^&#`'"\s]+/, 'locale=all')
    next = removeQueryParam(next, activeFlag.name, 'true')
  } else {
    next = next.replace(`${activeFlag.name}=true`, 'locale=all')
  }

  return { text: next }
}

function getRestAbsentLocaleSource(text: string): AbsentWriteLocaleSource {
  const queryStart = text.indexOf('?')
  if (queryStart !== -1 && text.slice(queryStart + 1).includes('${')) {
    return 'inherited'
  }

  return 'default'
}

function removeQueryParam(text: string, name: string, value: string): string {
  return text.replace(
    new RegExp(`([?&])${name}=${value}(&?)`, 'g'),
    (_match, prefix: string, suffix: string) => (suffix ? prefix : ''),
  )
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

function rewriteGraphqlAllLocaleArgs(text: string): {
  ambiguous: boolean
  changed: boolean
  text: string
  unsafeWriteLocale?: boolean
} {
  if (!hasGraphqlAllLocaleArg(text)) {
    return { ambiguous: false, changed: false, text }
  }

  let ambiguous = false
  let changed = false
  let next = text
  let unsafeWriteLocale = false

  for (const field of findGraphqlFieldArguments(text).reverse()) {
    const args = text.slice(field.argsStart, field.argsEnd)
    if (!hasTopLevelGraphqlAllLocaleArg(args)) {
      continue
    }

    if (
      graphqlOperationBefore({ offset: field.fieldStart, text }) !== 'mutation' ||
      !/^(?:create|duplicate|update)/i.test(field.fieldName)
    ) {
      ambiguous = true
      continue
    }

    const rewritten = rewriteGraphqlPublicationArgs({ args, fieldName: field.fieldName })
    ambiguous ||= rewritten.ambiguous
    changed ||= rewritten.changed
    unsafeWriteLocale ||= rewritten.unsafeWriteLocale === true
    next = `${next.slice(0, field.argsStart)}${rewritten.args}${next.slice(field.argsEnd)}`
  }

  return { ambiguous, changed, text: next, unsafeWriteLocale }
}

function rewriteGraphqlPublicationArgs({ args, fieldName }: { args: string; fieldName: string }): {
  ambiguous: boolean
  args: string
  changed: boolean
  unsafeWriteLocale?: boolean
} {
  const graphqlArgs = findTopLevelGraphqlArguments(args)
  const flagArguments = graphqlArgs.filter(
    ({ name }) => name === 'publishAllLocales' || name === 'unpublishAllLocales',
  )
  let next = args
  const activeFlags: Array<{ action: PublicationAction; name: string }> = []

  for (const argument of flagArguments) {
    const name = argument.name
    const value = args.slice(argument.valueStart, argument.valueEnd)

    if (value === 'false') {
      const currentArgument = findTopLevelGraphqlArguments(next).find(
        (candidate) => candidate.name === name,
      )
      if (currentArgument) {
        next = removeGraphqlArgument(next, currentArgument)
      }
      continue
    }

    if (value !== 'true') {
      return { ambiguous: true, args, changed: false }
    }

    activeFlags.push({
      name,
      action: name === 'publishAllLocales' ? 'publish' : 'unpublish',
    })
  }

  if (activeFlags.length > 1) {
    return { ambiguous: true, args: next, changed: next !== args }
  }

  const activeFlag = activeFlags[0]
  if (!activeFlag) {
    return { ambiguous: false, args: next, changed: next !== args }
  }

  if (activeFlag.action === 'unpublish' && !/^update/i.test(fieldName)) {
    return { ambiguous: true, args: next, changed: next !== args }
  }

  const currentArguments = findTopLevelGraphqlArguments(next)
  const actionArgument = currentArguments.find(({ name }) => name === 'action')
  if (!actionArgument) {
    return { ambiguous: true, args: next, changed: next !== args }
  }
  const action = next.slice(actionArgument.valueStart, actionArgument.valueEnd)
  if (action !== activeFlag.action) {
    return { ambiguous: true, args: next, changed: next !== args }
  }

  const localeArgument = currentArguments.find(({ name }) => name === 'locale')
  const locale = localeArgument
    ? next.slice(localeArgument.valueStart, localeArgument.valueEnd)
    : undefined
  if (locale?.startsWith('$')) {
    return { ambiguous: true, args: next, changed: next !== args }
  }

  const dataArgument = currentArguments.find(({ name }) => name === 'data')
  if (
    !isWriteLocalePreserved({
      absentLocaleSource: 'inherited',
      hasPotentialWriteData:
        dataArgument !== undefined &&
        hasPotentialGraphqlWriteData({ args: next, argument: dataArgument }),
      locale,
    })
  ) {
    return {
      ambiguous: true,
      args,
      changed: false,
      unsafeWriteLocale: true,
    }
  }

  if (localeArgument) {
    next = replaceRange({
      end: localeArgument.valueEnd,
      replacement: 'all',
      start: localeArgument.valueStart,
      text: next,
    })
    const currentFlag = findTopLevelGraphqlArguments(next).find(
      ({ name }) => name === activeFlag.name,
    )
    if (currentFlag) {
      next = removeGraphqlArgument(next, currentFlag)
    }
  } else {
    const currentFlag = findTopLevelGraphqlArguments(next).find(
      ({ name }) => name === activeFlag.name,
    )
    if (currentFlag) {
      next = replaceRange({
        end: currentFlag.valueEnd,
        replacement: 'locale: all',
        start: currentFlag.nameStart,
        text: next,
      })
    }
  }

  return { ambiguous: false, args: next, changed: next !== args }
}

function hasPotentialGraphqlWriteData({
  args,
  argument,
}: {
  args: string
  argument: GraphqlArgument
}): boolean {
  if (args[argument.valueStart] !== '{') {
    return true
  }

  const end = findClosingGraphqlBrace({ openBrace: argument.valueStart, text: args })
  if (end === undefined) {
    return true
  }

  const contents = args.slice(argument.valueStart + 1, end).replace(/#[^\n\r]*/g, '')
  return !/^[\s,]*$/.test(contents)
}

function findClosingGraphqlBrace({
  openBrace,
  text,
}: {
  openBrace: number
  text: string
}): number | undefined {
  let depth = 1

  for (let index = openBrace + 1; index < text.length; index++) {
    const skipped = skipGraphqlIgnored({ index, text })
    if (skipped !== index) {
      index = skipped - 1
      continue
    }

    if (text[index] === '{') {
      depth++
    } else if (text[index] === '}') {
      depth--
      if (depth === 0) {
        return index
      }
    }
  }

  return undefined
}

function findGraphqlFieldArguments(text: string): GraphqlFieldArguments[] {
  const fields: GraphqlFieldArguments[] = []

  for (let index = 0; index < text.length; index++) {
    const skipped = skipGraphqlIgnored({ index, text })
    if (skipped !== index) {
      index = skipped - 1
      continue
    }

    if (!/[a-z_]/.test(text[index] ?? '')) {
      continue
    }

    const fieldStart = index
    while (/\w/.test(text[index] ?? '')) {
      index++
    }
    const fieldName = text.slice(fieldStart, index)
    if (fieldName === 'mutation' || fieldName === 'query' || fieldName === 'subscription') {
      index--
      continue
    }

    const openParen = skipGraphqlWhitespace({ index, text })
    if (text[openParen] !== '(') {
      index--
      continue
    }

    const closeParen = findClosingGraphqlParen({ openParen, text })
    if (closeParen === undefined) {
      break
    }

    fields.push({
      argsEnd: closeParen,
      argsStart: openParen + 1,
      fieldName,
      fieldStart,
    })
    index = closeParen
  }

  return fields
}

function findTopLevelGraphqlArguments(args: string): GraphqlArgument[] {
  const argumentsFound: GraphqlArgument[] = []
  let bracketDepth = 0

  for (let index = 0; index < args.length; index++) {
    const skipped = skipGraphqlIgnored({ index, text: args })
    if (skipped !== index) {
      index = skipped - 1
      continue
    }

    const char = args[index]
    if (char === '{' || char === '[' || char === '(') {
      bracketDepth++
      continue
    }
    if (char === '}' || char === ']' || char === ')') {
      bracketDepth--
      continue
    }
    if (bracketDepth !== 0 || !/[a-z_]/i.test(char ?? '')) {
      continue
    }

    const nameStart = index
    while (/\w/.test(args[index] ?? '')) {
      index++
    }
    const name = args.slice(nameStart, index)
    const colon = skipGraphqlWhitespace({ index, text: args })
    if (args[colon] !== ':') {
      index--
      continue
    }

    const valueStart = skipGraphqlWhitespace({ index: colon + 1, text: args })
    const valueEnd = findGraphqlSimpleValueEnd({ index: valueStart, text: args })
    argumentsFound.push({ name, nameStart, valueEnd, valueStart })
    index = valueEnd - 1
  }

  return argumentsFound
}

function findGraphqlSimpleValueEnd({ index, text }: { index: number; text: string }): number {
  if (text.startsWith('"""', index) || text[index] === '"') {
    return skipGraphqlString({ index, text })
  }

  let end = index
  while (/[$\w.-]/.test(text[end] ?? '')) {
    end++
  }
  return end
}

function findClosingGraphqlParen({
  openParen,
  text,
}: {
  openParen: number
  text: string
}): number | undefined {
  let depth = 1

  for (let index = openParen + 1; index < text.length; index++) {
    const skipped = skipGraphqlIgnored({ index, text })
    if (skipped !== index) {
      index = skipped - 1
      continue
    }

    if (text[index] === '(') {
      depth++
    } else if (text[index] === ')') {
      depth--
      if (depth === 0) {
        return index
      }
    }
  }

  return undefined
}

function skipGraphqlIgnored({ index, text }: { index: number; text: string }): number {
  if (text.startsWith('"""', index) || text[index] === '"') {
    return skipGraphqlString({ index, text })
  }

  if (text[index] === '#') {
    const newline = text.indexOf('\n', index)
    return newline === -1 ? text.length : newline
  }

  return index
}

function skipGraphqlString({ index, text }: { index: number; text: string }): number {
  if (text.startsWith('"""', index)) {
    const end = text.indexOf('"""', index + 3)
    return end === -1 ? text.length : end + 3
  }

  for (let cursor = index + 1; cursor < text.length; cursor++) {
    if (text[cursor] === '\\') {
      cursor++
    } else if (text[cursor] === '"') {
      return cursor + 1
    }
  }

  return text.length
}

function skipGraphqlWhitespace({ index, text }: { index: number; text: string }): number {
  while (/\s|,/.test(text[index] ?? '')) {
    index++
  }
  return index
}

function removeGraphqlArgument(args: string, argument: GraphqlArgument): string {
  const lineStart = args.lastIndexOf('\n', argument.nameStart - 1) + 1
  const lineEnd = args.indexOf('\n', argument.valueEnd)
  const lineRemainder = args.slice(argument.valueEnd, lineEnd === -1 ? args.length : lineEnd).trim()

  if (
    /^\s*$/.test(args.slice(lineStart, argument.nameStart)) &&
    (lineRemainder === '' || lineRemainder === ',')
  ) {
    return replaceRange({
      end: lineEnd === -1 ? args.length : lineEnd + 1,
      replacement: '',
      start: lineStart,
      text: args,
    })
  }

  let end = argument.valueEnd
  while (/\s/.test(args[end] ?? '')) {
    end++
  }
  if (args[end] === ',') {
    end++
    while (/\s/.test(args[end] ?? '')) {
      end++
    }
    return replaceRange({ end, replacement: '', start: argument.nameStart, text: args })
  }

  let precedingSeparator = argument.nameStart
  while (/\s/.test(args[precedingSeparator - 1] ?? '')) {
    precedingSeparator--
  }
  const start = args[precedingSeparator - 1] === ',' ? precedingSeparator - 1 : argument.nameStart

  return replaceRange({ end, replacement: '', start, text: args })
}

function replaceRange({
  end,
  replacement,
  start,
  text,
}: {
  end: number
  replacement: string
  start: number
  text: string
}): string {
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`
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

function hasAllLocaleQueryParam(value: string): boolean {
  return /\b(?:publishAllLocales|unpublishAllLocales)=/.test(value)
}

function hasGraphqlAllLocaleArg(value: string): boolean {
  return /\b(?:publishAllLocales|unpublishAllLocales):/.test(value)
}

function hasTopLevelGraphqlAllLocaleArg(value: string): boolean {
  return findTopLevelGraphqlArguments(value).some(
    ({ name }) => name === 'publishAllLocales' || name === 'unpublishAllLocales',
  )
}
