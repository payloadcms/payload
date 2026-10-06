import type { ObjectLiteralExpression, PropertyAssignment } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'
import type { Target } from './resolveTarget.js'

import {
  getProperty,
  getTargets,
  getValue,
  hasUnsafeMembers,
  isPayloadReceiver,
  unwrap,
} from './resolveTarget.js'

const readOperations = new Set(['count', 'find', 'findByID', 'findDistinct', 'findGlobal'])
const specializedOperations = new Set([
  'countGlobalVersions',
  'countVersions',
  'duplicate',
  'findGlobalVersionByID',
  'findGlobalVersions',
  'findVersionByID',
  'findVersions',
  'restoreGlobalVersion',
  'restoreVersion',
])
const writeOperations = new Set(['create', 'update', 'updateGlobal'])
const legacyNames = ['draft', 'publishAllLocales', 'unpublishAllLocales']

/** Migrate only calls whose receiver, target and option semantics can be established. */
export const migrateDraftVersionSelectors: Transform = {
  name: 'migrate-draft-version-selectors',
  apply: ({ project }) => {
    const originalAllowJs = project.getCompilerOptions().allowJs
    const hasJavaScript = project
      .getSourceFiles()
      .some((source) => /\.[cm]?jsx?$/.test(source.getFilePath()))

    if (hasJavaScript && !originalAllowJs) {
      project.compilerOptions.set({ allowJs: true })
    }

    try {
      const targets = getTargets({ project })
      const filesChanged: string[] = []
      const notes: string[] = []

      for (const source of project.getSourceFiles()) {
        const edits: Edit[] = []

        for (const call of source.getDescendantsOfKind(SyntaxKind.CallExpression)) {
          const callee = call.getExpression()

          if (!Node.isPropertyAccessExpression(callee)) {
            continue
          }

          const operation = callee.getName()
          const options = unwrap({ node: call.getArguments()[0] })
          const isKnownReceiver = isPayloadReceiver({ node: callee.getExpression() })

          if (
            !readOperations.has(operation) &&
            !writeOperations.has(operation) &&
            !specializedOperations.has(operation)
          ) {
            continue
          }

          const note = (reason: string) =>
            notes.push(
              `${source.getFilePath()}:${call.getStartLineNumber()}:${source.getLineAndColumnAtPos(call.getStart()).column}: ${reason} Migrate this call manually.`,
            )

          if (!options || !Node.isObjectLiteralExpression(options)) {
            if (isKnownReceiver) {
              note(
                'Options are not an inline object; shared or dynamic arguments cannot be rewritten safely.',
              )
            }
            continue
          }

          const hasLegacyOption = legacyNames.some((name) => getProperty({ name, object: options }))
          const needsWriteDefault =
            writeOperations.has(operation) && !getProperty({ name: 'version', object: options })

          const hasUnresolvedOptions = [
            options,
            ...options.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression),
          ].some((object) => hasUnsafeMembers({ object }))

          if (!hasLegacyOption && !needsWriteDefault && !hasUnresolvedOptions) {
            continue
          }

          if (!isKnownReceiver) {
            if (
              (hasLegacyOption || needsWriteDefault || hasUnresolvedOptions) &&
              (getProperty({ name: 'collection', object: options }) ||
                getProperty({ name: 'slug', object: options }))
            ) {
              note('The receiver cannot be identified as Payload or PayloadSDK.')
            }
            continue
          }

          if (specializedOperations.has(operation)) {
            note(
              'Historical, duplication and restoration operations need operation-specific review.',
            )
            continue
          }

          if (getProperty({ name: 'version', object: options })) {
            note('Existing version and retired arguments coexist; their precedence needs review.')
            continue
          }

          if (hasUnresolvedOptions) {
            note('Options contain a spread, computed/duplicate key, or accessor.')
            continue
          }

          const kind = operation.includes('Global') ? 'globals' : 'collections'
          const slug = getValue({
            name: kind === 'globals' ? 'slug' : 'collection',
            object: options,
          })
          const target =
            slug && Node.isStringLiteral(slug)
              ? targets.get(`${kind}:${slug.getLiteralValue()}`)
              : undefined

          if (target?.drafts === undefined) {
            note('Draft support cannot be established from a registered static configuration.')
            continue
          }

          const result = planOptions({ operation, options, target })

          if (typeof result === 'string') {
            note(result)
          } else {
            edits.push(...result)
          }
        }

        if (edits.length > 0) {
          for (const edit of mergeRemovals({ edits }).sort((a, b) => b.start - a.start)) {
            source.replaceText([edit.start, edit.end], edit.text)
          }
          filesChanged.push(source.getFilePath())
        }
      }

      return { filesChanged, ...(notes.length ? { notes } : {}) }
    } finally {
      if (hasJavaScript && !originalAllowJs) {
        project.compilerOptions.set({ allowJs: originalAllowJs })
      }
    }
  },
  description:
    'Migrate proven Local API and SDK draft flags to version selectors; report ambiguous defaults, options and locale publication for manual review.',
}

type Edit = { end: number; start: number; text: string }

function planOptions({
  operation,
  options,
  target,
}: {
  operation: string
  options: ObjectLiteralExpression
  target: Target
}): Edit[] | string {
  const edits: Edit[] = []
  const draft = getProperty({ name: 'draft', object: options })
  const data = unwrap({ node: getValue({ name: 'data', object: options }) })
  const status =
    data && Node.isObjectLiteralExpression(data)
      ? getValue({ name: '_status', object: data })
      : undefined

  if (
    draft &&
    (!Node.isPropertyAssignment(draft) ||
      ![SyntaxKind.FalseKeyword, SyntaxKind.TrueKeyword].includes(
        draft.getInitializer()?.getKind() ?? SyntaxKind.Unknown,
      ))
  ) {
    return 'The draft flag is not a literal boolean.'
  }

  const isDraft =
    draft &&
    Node.isPropertyAssignment(draft) &&
    draft.getInitializer()?.getKind() === SyntaxKind.TrueKeyword

  const localeEdits = planLocaleOptions({ isDraft: Boolean(isDraft), operation, options, target })

  if (typeof localeEdits === 'string') {
    return localeEdits
  }
  if (localeEdits?.isPublication) {
    return localeEdits.edits
  }
  edits.push(...(localeEdits?.edits ?? []))

  if (!target.drafts) {
    if (isDraft) {
      return 'A draft preview flag on a non-draft target can affect hooks or relationship population.'
    }
    return [...edits, ...(draft ? removeProperty({ property: draft }) : [])]
  }

  let version: string | undefined

  if (readOperations.has(operation)) {
    version = isDraft ? 'latest' : 'published'
  } else if (operation === 'create') {
    if (isDraft) {
      version = 'draft'
    } else if (status && Node.isStringLiteral(status) && status.getLiteralValue() === 'draft') {
      return 'Removing draft: false from a draft-status create can change field validation.'
    } else if (
      status &&
      Node.isStringLiteral(status) &&
      ['draft', 'published'].includes(status.getLiteralValue())
    ) {
      return [...edits, ...(draft ? removeProperty({ property: draft }) : [])]
    } else {
      return 'Create publication status depends on defaults, hooks or dynamic data.'
    }
  } else {
    version = isDraft ? 'draft' : 'latest'
  }

  if (draft && Node.isPropertyAssignment(draft)) {
    edits.push({
      end: draft.getNameNode().getEnd(),
      start: draft.getNameNode().getStart(),
      text: 'version',
    })
    const value = draft.getInitializer()!
    edits.push({ end: value.getEnd(), start: value.getStart(), text: `'${version}'` })
  } else {
    edits.push(insertProperties({ object: options, properties: [`version: '${version}'`] }))
  }

  return edits
}

function insertProperties({
  object,
  properties,
}: {
  object: ObjectLiteralExpression
  properties: string[]
}): Edit {
  const position = object.getFirstChildByKindOrThrow(SyntaxKind.OpenBraceToken).getEnd()
  const text = object.getText().includes('\n')
    ? `\n${properties.map((property) => `${object.getProperties()[0]?.getIndentationText() ?? '  '}${property},`).join('\n')}`
    : ` ${properties.join(', ')},`

  return { end: position, start: position, text }
}

function removeProperty({ property }: { property: PropertyAssignment }): Edit[] {
  const after = property.getNextSiblingIfKind(SyntaxKind.CommaToken)
  const comma = after ?? property.getPreviousSiblingIfKind(SyntaxKind.CommaToken)
  const gap =
    !after && comma
      ? property.getSourceFile().getFullText().slice(comma.getEnd(), property.getStart())
      : undefined
  const start = gap !== undefined && /^[ \t]*$/.test(gap) ? comma!.getEnd() : property.getStart()
  const comments = property.getText().match(/\/\/[^\r\n]*(?:\r?\n|$)|\/\*[\s\S]*?\*\//g) ?? []

  return [
    { end: property.getEnd(), start, text: comments.length ? `${comments.join('\n')}\n` : '' },
    ...(comma ? [{ end: comma.getEnd(), start: comma.getStart(), text: '' }] : []),
  ]
}

function planLocaleOptions({
  isDraft,
  operation,
  options,
  target,
}: {
  isDraft: boolean
  operation: string
  options: ObjectLiteralExpression
  target: Target
}): { edits: Edit[]; isPublication: boolean } | string | undefined {
  const publish = getProperty({ name: 'publishAllLocales', object: options })
  const unpublish = getProperty({ name: 'unpublishAllLocales', object: options })
  const flags = [publish, unpublish].filter((property): property is PropertyAssignment =>
    Boolean(property && Node.isPropertyAssignment(property)),
  )

  if (!publish && !unpublish) {
    return undefined
  }
  if (
    flags.length !== Number(Boolean(publish)) + Number(Boolean(unpublish)) ||
    flags.some(
      (flag) =>
        ![SyntaxKind.FalseKeyword, SyntaxKind.TrueKeyword].includes(
          flag.getInitializer()?.getKind() ?? SyntaxKind.Unknown,
        ),
    )
  ) {
    return 'Locale publication flags are not literal booleans.'
  }
  const isPublishing =
    publish &&
    Node.isPropertyAssignment(publish) &&
    publish.getInitializer()?.getKind() === SyntaxKind.TrueKeyword
  const isUnpublishing =
    unpublish &&
    Node.isPropertyAssignment(unpublish) &&
    unpublish.getInitializer()?.getKind() === SyntaxKind.TrueKeyword
  const edits = flags.flatMap((property) => removeProperty({ property }))

  if (!isPublishing && !isUnpublishing) {
    if (publish && target.localizedStatus !== false) {
      return 'Removing a false publication flag can change all-locale publication behavior.'
    }
    return { edits, isPublication: false }
  }
  if (
    !['update', 'updateGlobal'].includes(operation) ||
    !target.drafts ||
    target.localizedStatus !== true ||
    (isPublishing && isUnpublishing) ||
    isDraft
  ) {
    return 'Locale publication requires proven status support and an unambiguous update selector.'
  }
  const data = unwrap({ node: getValue({ name: 'data', object: options }) })
  const status =
    data && Node.isObjectLiteralExpression(data)
      ? getValue({ name: '_status', object: data })
      : undefined
  const expectedStatus = isPublishing ? 'published' : 'draft'

  if (
    !data ||
    !Node.isObjectLiteralExpression(data) ||
    data
      .getProperties()
      .some((property) => property !== getProperty({ name: '_status', object: data })) ||
    (getProperty({ name: '_status', object: data }) &&
      (!status || !Node.isStringLiteral(status) || status.getLiteralValue() !== expectedStatus))
  ) {
    return 'Locale publication data contains fields or a conflicting/dynamic status; locale-keyed inputs need review.'
  }
  const locale = getProperty({ name: 'locale', object: options })
  const localeValue = getValue({ name: 'locale', object: options })

  if (locale && (!localeValue || !Node.isStringLiteral(localeValue))) {
    return 'The locale is dynamic; changing it would discard its evaluation.'
  }
  const draft = getProperty({ name: 'draft', object: options })

  if (draft && Node.isPropertyAssignment(draft)) {
    edits.push(...removeProperty({ property: draft }))
  }
  const properties = [`version: '${isPublishing ? 'latest' : 'published'}'`]

  if (localeValue) {
    edits.push({ end: localeValue.getEnd(), start: localeValue.getStart(), text: "'all'" })
  } else {
    properties.push("locale: 'all'")
  }
  if (!status) {
    edits.push(insertProperties({ object: data, properties: [`_status: '${expectedStatus}'`] }))
  }
  edits.push(insertProperties({ object: options, properties }))

  return { edits, isPublication: true }
}

function mergeRemovals({ edits }: { edits: Edit[] }): Edit[] {
  const merged: Edit[] = []

  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    const previous = merged[merged.length - 1]

    if (previous?.text === '' && edit.text === '' && edit.start <= previous.end) {
      previous.end = Math.max(previous.end, edit.end)
    } else {
      merged.push({ ...edit })
    }
  }

  return merged
}
