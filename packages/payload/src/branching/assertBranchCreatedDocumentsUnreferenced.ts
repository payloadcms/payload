import type { Field, FlattenedField } from '../fields/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { APIError } from '../errors/index.js'
import { fieldIsVirtual, fieldShouldBeLocalized } from '../fields/config/types.js'
import { flattenAllFields } from '../utilities/flattenAllFields.js'
import { corePayloadCollectionSlugs, hardExcludedSlugs } from './sanitizeBranchingConfig.js'
import { branchesCollectionSlug, branchField, MAIN_BRANCH } from './types.js'

export type BranchCreatedTarget = {
  collectionSlug: string
  docID: number | string
}

type BranchCreatedReferenceArgs = {
  data: unknown
  dataShape: 'flattened' | 'withLocales'
  fields: FlattenedField[]
  payloadBlocks: PayloadRequest['payload']['blocks']
  req: PayloadRequest
  target: BranchCreatedTarget
}

type Args = {
  /** Individual branch-global owners that the same selected discard will remove. */
  ignoredGlobalOwnerBranches?: Map<string, Set<string>>
  /** Branch rows and version chains that the same operation will remove. */
  ignoredOwnerBranch?: string
  /** Individual owner rows that the same selected discard will remove. */
  ignoredOwnerRowIDs?: Map<string, Set<number | string>>
  req: PayloadRequest
  targets: BranchCreatedTarget[]
}

type DataPath = {
  path: string
}

type RelationshipPath = {
  hasBlockAncestor: boolean
  hasLocalizedAncestor: boolean
  isPolymorphic: boolean
} & DataPath

/**
 * Refuses to hard-delete branch-created documents while surviving content refers to them.
 *
 * Reads through the database adapter so access, hooks, hidden fields and configured selects
 * cannot hide a relationship that the database would remove or leave dangling.
 */
export const assertBranchCreatedDocumentsUnreferenced = async ({
  ignoredGlobalOwnerBranches,
  ignoredOwnerBranch,
  ignoredOwnerRowIDs,
  req,
  targets,
}: Args): Promise<void> => {
  const excludedCollectionSlugs = new Set<string>([
    ...corePayloadCollectionSlugs,
    ...hardExcludedSlugs,
  ])
  let globalOwnerBranches: string[] | undefined

  const getGlobalOwnerBranches = async (): Promise<string[]> => {
    if (globalOwnerBranches) {
      return globalOwnerBranches
    }

    const { docs } = await req.payload.db.find({
      branch: false,
      collection: branchesCollectionSlug,
      limit: 0,
      pagination: false,
      req,
      where: {},
    })

    globalOwnerBranches = [
      MAIN_BRANCH,
      ...docs.flatMap((doc) => {
        const branchSlug = (doc as Record<string, unknown>).slug

        return typeof branchSlug === 'string' ? [branchSlug] : []
      }),
    ]

    return globalOwnerBranches
  }

  for (const target of deduplicateTargets(targets)) {
    for (const ownerCollection of req.payload.config.collections) {
      if (excludedCollectionSlugs.has(ownerCollection.slug)) {
        continue
      }

      const relationshipPaths = getRelationshipPaths({
        fields: ownerCollection.flattenedFields,
        payloadBlocks: req.payload.blocks,
        targetCollectionSlug: target.collectionSlug,
      })
      const richTextPaths = getRichTextPaths({
        fields: ownerCollection.flattenedFields,
        payloadBlocks: req.payload.blocks,
      })
      const hasRecursiveBlockReferences = hasRecursiveBlocks({
        fields: ownerCollection.flattenedFields,
        payloadBlocks: req.payload.blocks,
      })

      if (!relationshipPaths.length && !richTextPaths.length) {
        continue
      }

      const ignoredRowIDs = ignoredOwnerRowIDs?.get(ownerCollection.slug)
      const liveConditions: Where[] = []

      if (
        ignoredOwnerBranch &&
        req.payload.config.branching.branchableCollections.has(ownerCollection.slug)
      ) {
        liveConditions.push({ [branchField]: { not_equals: ignoredOwnerBranch } })
      }

      if (ignoredRowIDs?.size) {
        liveConditions.push({ id: { not_in: [...ignoredRowIDs] } })
      }

      const shouldScanEveryDocument =
        richTextPaths.length > 0 ||
        hasRecursiveBlockReferences ||
        relationshipPaths.some(
          ({ hasBlockAncestor, hasLocalizedAncestor }) => hasBlockAncestor || hasLocalizedAncestor,
        )
      const possibleOwners = await req.payload.db.find({
        branch: false,
        collection: ownerCollection.slug,
        limit: 0,
        locale: 'all',
        pagination: false,
        req,
        where: shouldScanEveryDocument
          ? liveConditions.length
            ? combineConditions(liveConditions)
            : {}
          : combineConditions([
              buildRelationshipWhere({ relationshipPaths, target }),
              ...liveConditions,
            ]),
      })

      if (
        possibleOwners.docs.some((doc) =>
          hasBranchCreatedDocumentReference({
            data: doc,
            dataShape: 'withLocales',
            fields: ownerCollection.flattenedFields,
            payloadBlocks: req.payload.blocks,
            req,
            target,
          }),
        )
      ) {
        throwReferenceError()
      }

      if (!ownerCollection.versions) {
        continue
      }

      const versionConditions: Where[] = []

      if (
        ignoredOwnerBranch &&
        req.payload.config.branching.branchableCollections.has(ownerCollection.slug)
      ) {
        versionConditions.push({ [branchField]: { not_equals: ignoredOwnerBranch } })
      }

      if (ignoredRowIDs?.size) {
        versionConditions.push({ parent: { not_in: [...ignoredRowIDs] } })
      }

      const possibleVersions = await req.payload.db.findVersions({
        branch: false,
        collection: ownerCollection.slug,
        limit: 0,
        locale: 'all',
        pagination: false,
        req,
        where: shouldScanEveryDocument
          ? versionConditions.length
            ? combineConditions(versionConditions)
            : {}
          : combineConditions([
              buildRelationshipWhere({
                pathPrefix: 'version',
                relationshipPaths,
                target,
              }),
              ...versionConditions,
            ]),
      })

      if (
        possibleVersions.docs.some((version) =>
          hasBranchCreatedDocumentReference({
            data: version.version,
            dataShape: 'withLocales',
            fields: ownerCollection.flattenedFields,
            payloadBlocks: req.payload.blocks,
            req,
            target,
          }),
        )
      ) {
        throwReferenceError()
      }
    }

    for (const ownerGlobal of req.payload.globals.config) {
      const relationshipPaths = getRelationshipPaths({
        fields: ownerGlobal.flattenedFields,
        payloadBlocks: req.payload.blocks,
        targetCollectionSlug: target.collectionSlug,
      })
      const richTextPaths = getRichTextPaths({
        fields: ownerGlobal.flattenedFields,
        payloadBlocks: req.payload.blocks,
      })
      const hasRecursiveBlockReferences = hasRecursiveBlocks({
        fields: ownerGlobal.flattenedFields,
        payloadBlocks: req.payload.blocks,
      })

      if (!relationshipPaths.length && !richTextPaths.length) {
        continue
      }

      const ignoredGlobalBranches = new Set(ignoredGlobalOwnerBranches?.get(ownerGlobal.slug) ?? [])

      if (
        ignoredOwnerBranch &&
        req.payload.config.branching.branchableGlobals.has(ownerGlobal.slug)
      ) {
        ignoredGlobalBranches.add(ignoredOwnerBranch)
      }

      const isBranchableGlobal = req.payload.config.branching.branchableGlobals.has(
        ownerGlobal.slug,
      )
      const shouldScanEveryGlobal =
        richTextPaths.length > 0 ||
        hasRecursiveBlockReferences ||
        relationshipPaths.some(
          ({ hasBlockAncestor, hasLocalizedAncestor }) => hasBlockAncestor || hasLocalizedAncestor,
        )
      const ownerBranches = isBranchableGlobal ? await getGlobalOwnerBranches() : [MAIN_BRANCH]

      for (const ownerBranch of ownerBranches) {
        if (ignoredGlobalBranches.has(ownerBranch)) {
          continue
        }

        const ownerConditions: Where[] = []

        if (isBranchableGlobal) {
          ownerConditions.push({ [branchField]: { equals: ownerBranch } })
        }

        if (!shouldScanEveryGlobal) {
          ownerConditions.unshift(buildRelationshipWhere({ relationshipPaths, target }))
        }

        const possibleOwner = await req.payload.db.findGlobal({
          slug: ownerGlobal.slug,
          branch: false,
          locale: 'all',
          req,
          where: ownerConditions.length ? combineConditions(ownerConditions) : undefined,
        })

        if (
          possibleOwner &&
          hasBranchCreatedDocumentReference({
            data: possibleOwner,
            dataShape: 'withLocales',
            fields: ownerGlobal.flattenedFields,
            payloadBlocks: req.payload.blocks,
            req,
            target,
          })
        ) {
          throwReferenceError()
        }
      }

      if (!ownerGlobal.versions) {
        continue
      }

      const versionConditions: Where[] = []

      if (
        ignoredGlobalBranches.size &&
        req.payload.config.branching.branchableGlobals.has(ownerGlobal.slug)
      ) {
        versionConditions.push({ [branchField]: { not_in: [...ignoredGlobalBranches] } })
      }

      const possibleVersions = await req.payload.db.findGlobalVersions({
        branch: false,
        global: ownerGlobal.slug,
        limit: 0,
        locale: 'all',
        pagination: false,
        req,
        where: shouldScanEveryGlobal
          ? versionConditions.length
            ? combineConditions(versionConditions)
            : {}
          : combineConditions([
              buildRelationshipWhere({
                pathPrefix: 'version',
                relationshipPaths,
                target,
              }),
              ...versionConditions,
            ]),
      })

      if (
        possibleVersions.docs.some((version) =>
          hasBranchCreatedDocumentReference({
            data: version.version,
            dataShape: 'withLocales',
            fields: ownerGlobal.flattenedFields,
            payloadBlocks: req.payload.blocks,
            req,
            target,
          }),
        )
      ) {
        throwReferenceError()
      }
    }
  }
}

/** Checks persisted field data for a direct or serialized reference to one document. */
export const hasBranchCreatedDocumentReference = ({
  data,
  dataShape,
  fields,
  payloadBlocks,
  req,
  target,
}: BranchCreatedReferenceArgs): boolean =>
  hasReferenceInFields({ data, dataShape, fields, payloadBlocks, req, target })

/**
 * Returns the collection types that a configured field tree can reference.
 *
 * `undefined` means the field tree can contain references that are not described by static field
 * configuration. Rich text is intentionally unbounded because serialized nodes and editor-provided
 * subfields can reference collections at runtime.
 */
export const getPossibleRelationshipCollectionSlugs = ({
  fields,
  payloadBlocks,
}: {
  fields: FlattenedField[]
  payloadBlocks: PayloadRequest['payload']['blocks']
}): Set<string> | undefined =>
  collectPossibleRelationshipCollectionSlugs({
    fields,
    payloadBlocks,
    visitedBlockSlugs: new Set(),
  })

const collectPossibleRelationshipCollectionSlugs = ({
  fields,
  payloadBlocks,
  visitedBlockSlugs,
}: {
  fields: FlattenedField[]
  payloadBlocks: PayloadRequest['payload']['blocks']
  visitedBlockSlugs: Set<string>
}): Set<string> | undefined => {
  const collectionSlugs = new Set<string>()

  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      for (const relationTo of Array.isArray(field.relationTo)
        ? field.relationTo
        : [field.relationTo]) {
        collectionSlugs.add(relationTo)
      }

      continue
    }

    if (field.type === 'richText') {
      return undefined
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      const nestedCollectionSlugs = collectPossibleRelationshipCollectionSlugs({
        fields: field.flattenedFields,
        payloadBlocks,
        visitedBlockSlugs,
      })

      if (!nestedCollectionSlugs) {
        return undefined
      }

      for (const collectionSlug of nestedCollectionSlugs) {
        collectionSlugs.add(collectionSlug)
      }

      continue
    }

    if (field.type !== 'blocks') {
      continue
    }

    for (const blockReference of field.blocks) {
      const block =
        typeof blockReference === 'string' ? payloadBlocks[blockReference] : blockReference

      if (!block) {
        return undefined
      }

      if (visitedBlockSlugs.has(block.slug)) {
        continue
      }

      visitedBlockSlugs.add(block.slug)

      const nestedCollectionSlugs = collectPossibleRelationshipCollectionSlugs({
        fields: block.flattenedFields,
        payloadBlocks,
        visitedBlockSlugs,
      })

      if (!nestedCollectionSlugs) {
        return undefined
      }

      for (const collectionSlug of nestedCollectionSlugs) {
        collectionSlugs.add(collectionSlug)
      }
    }
  }

  return collectionSlugs
}

/** Returns whether configured relationship or upload fields contain any stored value. */
export const hasConfiguredRelationshipValue = ({
  data,
  dataShape,
  fields,
  payloadBlocks,
}: {
  data: unknown
  dataShape: BranchCreatedReferenceArgs['dataShape']
  fields: FlattenedField[]
  payloadBlocks: PayloadRequest['payload']['blocks']
}): boolean =>
  hasConfiguredRelationshipValueInFields({
    data,
    dataShape,
    fields,
    parentIsLocalized: false,
    payloadBlocks,
  })

const hasConfiguredRelationshipValueInFields = ({
  data,
  dataShape,
  fields,
  parentIsLocalized,
  payloadBlocks,
}: {
  data: unknown
  dataShape: BranchCreatedReferenceArgs['dataShape']
  fields: FlattenedField[]
  parentIsLocalized: boolean
  payloadBlocks: PayloadRequest['payload']['blocks']
}): boolean => {
  if (Array.isArray(data)) {
    return data.some((entry) =>
      hasConfiguredRelationshipValueInFields({
        data: entry,
        dataShape,
        fields,
        parentIsLocalized,
        payloadBlocks,
      }),
    )
  }

  if (!data || typeof data !== 'object') {
    return false
  }

  const record = data as Record<string, unknown>

  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    const fieldValues = getFieldValues({ dataShape, field, parentIsLocalized, record })
    const nestedParentIsLocalized =
      parentIsLocalized || ('localized' in field && Boolean(field.localized))

    if (field.type === 'relationship' || field.type === 'upload') {
      if (
        fieldValues.some((value) =>
          nestedValueMatches({
            matches: (nestedValue) =>
              nestedValue !== undefined && nestedValue !== null && nestedValue !== '',
            value,
          }),
        )
      ) {
        return true
      }

      continue
    }

    if (field.type === 'richText') {
      if (fieldValues.some((value) => value !== undefined && value !== null)) {
        return true
      }

      continue
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      if (
        fieldValues.some((value) =>
          hasConfiguredRelationshipValueInFields({
            data: value,
            dataShape,
            fields: field.flattenedFields,
            parentIsLocalized: nestedParentIsLocalized,
            payloadBlocks,
          }),
        )
      ) {
        return true
      }

      continue
    }

    if (field.type !== 'blocks') {
      continue
    }

    if (
      fieldValues.some((value) =>
        nestedValueMatches({
          matches: (row) => {
            if (!row || typeof row !== 'object') {
              return false
            }

            const rowRecord = row as Record<string, unknown>
            const block = resolveBlock({ blockType: rowRecord.blockType, field, payloadBlocks })

            return block
              ? hasConfiguredRelationshipValueInFields({
                  data: rowRecord,
                  dataShape,
                  fields: block.flattenedFields,
                  parentIsLocalized: nestedParentIsLocalized,
                  payloadBlocks,
                })
              : true
          },
          value,
        }),
      )
    ) {
      return true
    }
  }

  return false
}

type ReferenceFieldScanArgs = {
  parentIsLocalized?: boolean
} & BranchCreatedReferenceArgs

type RichTextSubFieldAdapter = {
  editorConfig?: {
    features?: {
      getSubFields?: Map<
        string,
        (args: { node: Record<string, unknown>; req: PayloadRequest }) => Field[] | null
      >
      getSubFieldsData?: Map<
        string,
        (args: {
          node: Record<string, unknown>
          req: PayloadRequest
        }) => null | Record<string, unknown>
      >
    }
  }
}

const hasReferenceInFields = ({
  data,
  dataShape,
  fields,
  parentIsLocalized = false,
  payloadBlocks,
  req,
  target,
}: ReferenceFieldScanArgs): boolean => {
  if (Array.isArray(data)) {
    return data.some((entry) =>
      hasReferenceInFields({
        data: entry,
        dataShape,
        fields,
        parentIsLocalized,
        payloadBlocks,
        req,
        target,
      }),
    )
  }

  if (!data || typeof data !== 'object') {
    return false
  }

  const record = data as Record<string, unknown>

  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    const fieldValues = getFieldValues({ dataShape, field, parentIsLocalized, record })
    const nestedParentIsLocalized =
      parentIsLocalized || ('localized' in field && Boolean(field.localized))

    if (field.type === 'relationship' || field.type === 'upload') {
      const isPolymorphic = Array.isArray(field.relationTo)
      const relationTargets = isPolymorphic ? field.relationTo : [field.relationTo]

      if (
        relationTargets.includes(target.collectionSlug as never) &&
        fieldValues.some((value) =>
          nestedValueMatches({
            matches: (nestedValue) =>
              isRelationshipReference({ isPolymorphic, target, value: nestedValue }),
            value,
          }),
        )
      ) {
        return true
      }

      continue
    }

    if (field.type === 'richText') {
      if (
        fieldValues.some((value) =>
          hasRichTextReferenceValue({
            dataShape,
            editor:
              typeof field.editor === 'function'
                ? undefined
                : (field.editor as RichTextSubFieldAdapter | undefined),
            parentIsLocalized: nestedParentIsLocalized,
            payloadBlocks,
            req,
            target,
            value,
          }),
        )
      ) {
        return true
      }

      continue
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      if (
        fieldValues.some((value) =>
          hasReferenceInFields({
            data: value,
            dataShape,
            fields: field.flattenedFields,
            parentIsLocalized: nestedParentIsLocalized,
            payloadBlocks,
            req,
            target,
          }),
        )
      ) {
        return true
      }

      continue
    }

    if (field.type === 'blocks') {
      if (
        fieldValues.some((value) =>
          nestedValueMatches({
            matches: (row) => {
              if (!row || typeof row !== 'object') {
                return false
              }

              const rowRecord = row as Record<string, unknown>
              const block = resolveBlock({ blockType: rowRecord.blockType, field, payloadBlocks })

              return block
                ? hasReferenceInFields({
                    data: rowRecord,
                    dataShape,
                    fields: block.flattenedFields,
                    parentIsLocalized: nestedParentIsLocalized,
                    payloadBlocks,
                    req,
                    target,
                  })
                : false
            },
            value,
          }),
        )
      ) {
        return true
      }
    }
  }

  return false
}

const getFieldValues = ({
  dataShape,
  field,
  parentIsLocalized,
  record,
}: {
  dataShape: BranchCreatedReferenceArgs['dataShape']
  field: FlattenedField
  parentIsLocalized: boolean
  record: Record<string, unknown>
}): unknown[] => {
  const value = record[field.name]
  const shouldReadLocaleMap =
    dataShape === 'withLocales' && fieldShouldBeLocalized({ field, parentIsLocalized })

  if (!shouldReadLocaleMap) {
    return [value]
  }

  return value && typeof value === 'object' && !Array.isArray(value) ? Object.values(value) : []
}

const nestedValueMatches = ({
  matches,
  value,
}: {
  matches: (value: unknown) => boolean
  value: unknown
}): boolean =>
  Array.isArray(value)
    ? value.some((entry) => nestedValueMatches({ matches, value: entry }))
    : matches(value)

const resolveBlock = ({
  blockType,
  field,
  payloadBlocks,
}: {
  blockType: unknown
  field: Extract<FlattenedField, { type: 'blocks' }>
  payloadBlocks: PayloadRequest['payload']['blocks']
}) => {
  if (typeof blockType !== 'string') {
    return undefined
  }

  const blockReference = field.blocks.find((block) =>
    typeof block === 'string' ? block === blockType : block.slug === blockType,
  )

  return typeof blockReference === 'string' ? payloadBlocks[blockReference] : blockReference
}

const hasRichTextReferenceValue = ({
  dataShape,
  editor,
  parentIsLocalized,
  payloadBlocks,
  req,
  target,
  value,
}: {
  dataShape: BranchCreatedReferenceArgs['dataShape']
  editor?: RichTextSubFieldAdapter
  parentIsLocalized: boolean
  payloadBlocks: PayloadRequest['payload']['blocks']
  req: PayloadRequest
  target: BranchCreatedTarget
  value: unknown
}): boolean => {
  const features = editor?.editorConfig?.features

  if (!features) {
    return containsSerializedReference({ target, value })
  }

  if (Array.isArray(value)) {
    return value.some((entry) =>
      hasRichTextReferenceValue({
        dataShape,
        editor,
        parentIsLocalized,
        payloadBlocks,
        req,
        target,
        value: entry,
      }),
    )
  }

  if (!value || typeof value !== 'object') {
    return false
  }

  const node = value as Record<string, unknown>
  const nodeType = node.type

  if (
    (nodeType === 'relationship' || nodeType === 'upload') &&
    node.relationTo === target.collectionSlug &&
    relationshipIDEquals({ targetID: target.docID, value: node.value })
  ) {
    return true
  }

  if (typeof nodeType === 'string') {
    const getSubFields = features?.getSubFields?.get(nodeType)
    const getSubFieldsData = features?.getSubFieldsData?.get(nodeType)

    if (getSubFields && getSubFieldsData) {
      const subFields = getSubFields({ node, req })
      const subFieldData = getSubFieldsData({ node, req })

      if (
        subFields?.length &&
        subFieldData &&
        hasReferenceInFields({
          data: subFieldData,
          dataShape,
          fields: flattenAllFields({ fields: subFields }),
          parentIsLocalized,
          payloadBlocks,
          req,
          target,
        })
      ) {
        return true
      }
    }
  }

  return [node.root, node.children].some((nestedValue) =>
    hasRichTextReferenceValue({
      dataShape,
      editor,
      parentIsLocalized,
      payloadBlocks,
      req,
      target,
      value: nestedValue,
    }),
  )
}

const deduplicateTargets = (targets: BranchCreatedTarget[]): BranchCreatedTarget[] => {
  const seen = new Set<string>()

  return targets.filter(({ collectionSlug, docID }) => {
    const key = `${collectionSlug}:${String(docID)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

const combineConditions = (conditions: Where[]): Where =>
  conditions.length === 1 ? conditions[0]! : { and: conditions }

const buildRelationshipWhere = ({
  pathPrefix,
  relationshipPaths,
  target,
}: {
  pathPrefix?: string
  relationshipPaths: RelationshipPath[]
  target: BranchCreatedTarget
}): Where => ({
  or: relationshipPaths.map(({ isPolymorphic, path }) => ({
    [pathPrefix ? `${pathPrefix}.${path}` : path]: {
      equals: isPolymorphic
        ? { relationTo: target.collectionSlug, value: target.docID }
        : target.docID,
    },
  })),
})

const hasRecursiveBlocks = ({
  activeBlockSlugs = new Set(),
  fields,
  payloadBlocks,
}: {
  activeBlockSlugs?: Set<string>
  fields: FlattenedField[]
  payloadBlocks: PayloadRequest['payload']['blocks']
}): boolean => {
  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      if (hasRecursiveBlocks({ activeBlockSlugs, fields: field.flattenedFields, payloadBlocks })) {
        return true
      }

      continue
    }

    if (field.type !== 'blocks') {
      continue
    }

    for (const blockReference of field.blocks) {
      const block =
        typeof blockReference === 'string' ? payloadBlocks[blockReference] : blockReference

      if (!block) {
        continue
      }

      if (activeBlockSlugs.has(block.slug)) {
        return true
      }

      const nestedActiveBlockSlugs = new Set(activeBlockSlugs)

      nestedActiveBlockSlugs.add(block.slug)

      if (
        hasRecursiveBlocks({
          activeBlockSlugs: nestedActiveBlockSlugs,
          fields: block.flattenedFields,
          payloadBlocks,
        })
      ) {
        return true
      }
    }
  }

  return false
}

const getRelationshipPaths = ({
  activeBlockSlugs = new Set(),
  fields,
  hasBlockAncestor = false,
  parentIsLocalized = false,
  parentPath = '',
  payloadBlocks,
  targetCollectionSlug,
}: {
  activeBlockSlugs?: Set<string>
  fields: FlattenedField[]
  hasBlockAncestor?: boolean
  parentIsLocalized?: boolean
  parentPath?: string
  payloadBlocks: PayloadRequest['payload']['blocks']
  targetCollectionSlug: string
}): RelationshipPath[] => {
  const paths: RelationshipPath[] = []

  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    const path = parentPath ? `${parentPath}.${field.name}` : field.name
    const isLocalized = parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })

    if (field.type === 'relationship' || field.type === 'upload') {
      if ('virtual' in field && field.virtual) {
        continue
      }

      const relationTargets = Array.isArray(field.relationTo)
        ? field.relationTo
        : [field.relationTo]

      if (relationTargets.includes(targetCollectionSlug as never)) {
        paths.push({
          hasBlockAncestor,
          hasLocalizedAncestor: isLocalized,
          isPolymorphic: Array.isArray(field.relationTo),
          path,
        })
      }

      continue
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      paths.push(
        ...getRelationshipPaths({
          activeBlockSlugs,
          fields: field.flattenedFields,
          hasBlockAncestor,
          parentIsLocalized: isLocalized,
          parentPath: path,
          payloadBlocks,
          targetCollectionSlug,
        }),
      )
      continue
    }

    if (field.type === 'blocks') {
      for (const blockReference of field.blocks) {
        const block =
          typeof blockReference === 'string' ? payloadBlocks[blockReference] : blockReference

        if (!block || activeBlockSlugs.has(block.slug)) {
          continue
        }

        const nestedActiveBlockSlugs = new Set(activeBlockSlugs)

        nestedActiveBlockSlugs.add(block.slug)

        paths.push(
          ...getRelationshipPaths({
            activeBlockSlugs: nestedActiveBlockSlugs,
            fields: block.flattenedFields,
            hasBlockAncestor: true,
            parentIsLocalized: isLocalized,
            parentPath: path,
            payloadBlocks,
            targetCollectionSlug,
          }),
        )
      }
    }
  }

  return paths
}

const getRichTextPaths = ({
  activeBlockSlugs = new Set(),
  fields,
  parentPath = '',
  payloadBlocks,
}: {
  activeBlockSlugs?: Set<string>
  fields: FlattenedField[]
  parentPath?: string
  payloadBlocks: PayloadRequest['payload']['blocks']
}): DataPath[] => {
  const paths: DataPath[] = []

  for (const field of fields) {
    if (fieldIsVirtual(field)) {
      continue
    }

    const path = parentPath ? `${parentPath}.${field.name}` : field.name

    if (field.type === 'richText') {
      paths.push({ path })
      continue
    }

    if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
      paths.push(
        ...getRichTextPaths({
          activeBlockSlugs,
          fields: field.flattenedFields,
          parentPath: path,
          payloadBlocks,
        }),
      )
      continue
    }

    if (field.type === 'blocks') {
      for (const blockReference of field.blocks) {
        const block =
          typeof blockReference === 'string' ? payloadBlocks[blockReference] : blockReference

        if (!block || activeBlockSlugs.has(block.slug)) {
          continue
        }

        const nestedActiveBlockSlugs = new Set(activeBlockSlugs)

        nestedActiveBlockSlugs.add(block.slug)

        paths.push(
          ...getRichTextPaths({
            activeBlockSlugs: nestedActiveBlockSlugs,
            fields: block.flattenedFields,
            parentPath: path,
            payloadBlocks,
          }),
        )
      }
    }
  }

  return [...new Set(paths)]
}

const isRelationshipReference = ({
  isPolymorphic,
  target,
  value,
}: {
  isPolymorphic: boolean
  target: BranchCreatedTarget
  value: unknown
}): boolean => {
  if (isPolymorphic) {
    if (!value || typeof value !== 'object') {
      return false
    }

    const relation = value as Record<string, unknown>

    return (
      relation.relationTo === target.collectionSlug &&
      relationshipIDEquals({ targetID: target.docID, value: relation.value })
    )
  }

  return relationshipIDEquals({ targetID: target.docID, value })
}

const relationshipIDEquals = ({
  targetID,
  value,
}: {
  targetID: number | string
  value: unknown
}): boolean => {
  const relatedID =
    value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value

  return (
    (typeof relatedID === 'number' || typeof relatedID === 'string') &&
    String(relatedID) === String(targetID)
  )
}

const containsSerializedReference = ({
  target,
  value,
}: {
  target: BranchCreatedTarget
  value: unknown
}): boolean => {
  if (Array.isArray(value)) {
    return value.some((entry) => containsSerializedReference({ target, value: entry }))
  }

  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  if (record.relationTo === target.collectionSlug) {
    if (relationshipIDEquals({ targetID: target.docID, value: record.value })) {
      return true
    }
  }

  return Object.values(record).some((nestedValue) =>
    containsSerializedReference({ target, value: nestedValue }),
  )
}

const throwReferenceError = (): never => {
  throw new APIError(
    'Branch-created content cannot be deleted while a surviving document or version references it.',
    409,
  )
}
