import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

import type { Block, Field } from '../../../fields/config/types.js'
import type { BranchHeadID } from '../types.js'

import {
  captureBranchProjectionShape,
  restoreBranchProjectionShape,
} from './branchProjectionShape.js'
import { branchProjectionMetadataField } from './buildBranchProjectionCollections.js'

type ProjectionContext = {
  blocks?: Block[]
  branchID: BranchHeadID
  fields: Field[]
  isGlobal?: boolean
  projectionSlugs: Record<string, string>
}

export const encodeBranchProjectionBranchKey = ({ branchID }: { branchID: BranchHeadID }): string =>
  encodeTuple({ tuple: ['branch', assertID({ value: branchID })] })

export const encodeBranchProjectionID = ({
  branchID,
  logicalID,
}: {
  branchID: BranchHeadID
  logicalID: BranchHeadID
}): string =>
  encodeTuple({
    tuple: ['document', assertID({ value: branchID }), assertID({ value: logicalID })],
  })

export const decodeBranchProjectionID = ({
  id,
  branchID,
  logicalID,
}: {
  branchID: BranchHeadID
  id: string
  logicalID: BranchHeadID
}): { branchID: BranchHeadID; logicalID: BranchHeadID } => {
  if (encodeBranchProjectionID({ branchID, logicalID }) !== id) {
    throw new Error('Invalid private branch projection document ID.')
  }
  return { branchID, logicalID }
}

/** Encode only schema-declared relationships and row IDs; JSON/editor data remains opaque. */
export const encodeBranchProjectionDocument = ({
  blocks = [],
  branchID,
  data,
  fields,
  isVisible = true,
  logicalID = data.id,
  projectionSlugs,
}: {
  data: Record<string, unknown>
  isVisible?: boolean
  logicalID?: unknown
} & ProjectionContext): Record<string, unknown> => {
  const documentID = assertID({ value: logicalID })

  if (typeof isVisible !== 'boolean') {
    throw new Error('Branch projection visibility must be boolean.')
  }

  if (Object.hasOwn(data, branchProjectionMetadataField)) {
    throw new Error('Content collides with private branch projection metadata.')
  }

  const relationships: Record<string, unknown> = {}
  const cloned = structuredClone(data)
  const shape = captureBranchProjectionShape({ blocks, data: cloned, fields })

  const document = transformFields({
    blocks,
    branchID,
    data: cloned,
    fields,
    logicalID: documentID,
    mode: 'encode',
    parentIsLocalized: false,
    path: [],
    projectionSlugs,
    relationships,
  })

  document.id = encodeBranchProjectionID({ branchID, logicalID: documentID })
  document[branchProjectionMetadataField] = {
    branchKey: encodeBranchProjectionBranchKey({ branchID }),
    isVisible,
    logicalID: documentID,
    relationships,
    shape,
  }

  return document
}

export const decodeBranchProjectionDocument = ({
  blocks = [],
  branchID,
  data,
  fields,
  isGlobal = false,
  projectionSlugs,
  shouldClone = true,
}: { data: Record<string, unknown>; shouldClone?: boolean } & ProjectionContext): Record<
  string,
  unknown
> => {
  if (typeof data.id !== 'string') {
    throw new Error('Missing private branch projection ID.')
  }

  const metadata = getRecord({ value: data[branchProjectionMetadataField] })
  const logicalID = assertID({ value: metadata?.logicalID })

  decodeBranchProjectionID({ id: data.id, branchID, logicalID })

  if (
    !metadata ||
    metadata.branchKey !== encodeBranchProjectionBranchKey({ branchID }) ||
    metadata.logicalID !== logicalID ||
    typeof metadata.isVisible !== 'boolean'
  ) {
    throw new Error('Invalid private branch projection metadata.')
  }

  const document = transformFields({
    blocks,
    branchID,
    data: shouldClone ? structuredClone(data) : data,
    fields,
    logicalID,
    mode: 'decode',
    parentIsLocalized: false,
    path: [],
    projectionSlugs,
    relationships: getRecord({ value: metadata.relationships }) ?? {},
  })

  if (isGlobal) {
    if (metadata.nativeGlobalID != null) {
      document.id = assertID({ value: metadata.nativeGlobalID })
    } else {
      delete document.id
    }
  } else {
    document.id = logicalID
  }
  delete document[branchProjectionMetadataField]

  return restoreBranchProjectionShape({ blocks, data: document, fields, shape: metadata.shape })
}

const assertID = ({ value }: { value: unknown }): BranchHeadID => {
  if (
    (typeof value === 'string' && value.length > 0) ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value
  }

  throw new Error('Branch projection IDs must be nonempty strings or finite numbers.')
}

const encodeTuple = ({ tuple }: { tuple: unknown[] }): string =>
  `bp2:${createHash('sha256').update(JSON.stringify(tuple)).digest('base64url')}`

const getRecord = ({ value }: { value: unknown }): null | Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

type WalkArgs = {
  data: Record<string, unknown>
  logicalID: BranchHeadID
  mode: 'decode' | 'encode'
  parentIsLocalized: boolean
  path: unknown[]
  relationships: Record<string, unknown>
} & Required<Omit<ProjectionContext, 'isGlobal'>>

const transformedFieldTypes = new Set([
  'array',
  'blocks',
  'group',
  'join',
  'relationship',
  'upload',
])

const transformFields = (args: WalkArgs): Record<string, unknown> => {
  const { data, fields } = args

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          transformValue({ ...args, field: { ...tab, type: 'group' } as Field })
        } else {
          transformFields({ ...args, fields: tab.fields })
        }
      }
    } else if (!('name' in field)) {
      if ('fields' in field) {
        transformFields({ ...args, fields: field.fields })
      }
    } else if (transformedFieldTypes.has(field.type) || 'fields' in field) {
      transformValue({ ...args, field })
    }
  }

  return data
}

const transformValue = ({ field, ...args }: { field: Field } & WalkArgs): void => {
  if (!('name' in field) || !Object.hasOwn(args.data, field.name)) {
    return
  }

  const value = args.data[field.name]
  const path = [...args.path, field.name]

  const record = getRecord({ value })

  if ('localized' in field && field.localized && !args.parentIsLocalized && record) {
    args.data[field.name] = Object.fromEntries(
      Object.entries(record).map(([locale, localizedValue]) => [
        locale,
        transformContent({
          ...args,
          field,
          parentIsLocalized: true,
          path: [...path, locale],
          value: localizedValue,
        }),
      ]),
    )
  } else {
    args.data[field.name] = transformContent({ ...args, field, path, value })
  }
}

const transformContent = ({
  field,
  value,
  ...args
}: { field: Field; value: unknown } & WalkArgs): unknown => {
  if (value === null || value === undefined) {
    return value
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    const hasProjection = (
      Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]
    ).some((slug) => Object.hasOwn(args.projectionSlugs, slug))
    if (!hasProjection) {
      return value
    }

    const key = JSON.stringify(args.path)
    const encode = (original: unknown): unknown =>
      field.hasMany && Array.isArray(original)
        ? original.map((relationship) =>
            transformRelationship({
              ...args,
              mode: 'encode',
              relationTo: field.relationTo,
              value: relationship,
            }),
          )
        : transformRelationship({
            ...args,
            mode: 'encode',
            relationTo: field.relationTo,
            value: original,
          })

    if (args.mode === 'encode') {
      args.relationships[key] = structuredClone(value)
      return encode(value)
    }
    if (
      !Object.hasOwn(args.relationships, key) ||
      !isDeepStrictEqual(encode(args.relationships[key]), value)
    ) {
      throw new Error('Invalid private branch relationship metadata.')
    }
    return structuredClone(args.relationships[key])
  }

  if (field.type === 'join') {
    const result = getRecord({ value })

    if (!result || !Array.isArray(result.docs)) {
      return value
    }

    return {
      ...result,
      // Native reverse joins select the actual typed logical ID in their statement.
      // No encoded cache identity is exposed or decoded without its metadata.
      docs: result.docs.map((document) => {
        const record = getRecord({ value: document })
        if (Array.isArray(field.collection)) {
          if (!record || typeof record.relationTo !== 'string') {
            throw new Error('Invalid private branch join result.')
          }
          const source =
            Object.keys(args.projectionSlugs).find(
              (slug) => args.projectionSlugs[slug] === record.relationTo,
            ) ?? record.relationTo
          if (!field.collection.includes(source)) {
            throw new Error('Unexpected private branch join target.')
          }
          return { relationTo: source, value: assertID({ value: record.value }) }
        }
        return assertID({ value: record ? record.id : document })
      }),
    }
  }

  if (field.type === 'array' || field.type === 'blocks') {
    if (!Array.isArray(value)) {
      throw new Error('Invalid branch projection array or blocks value.')
    }

    const seen = new Set<string>()

    return value.map((rawRow) => {
      const row = getRecord({ value: rawRow })

      if (!row) {
        throw new Error('Invalid branch projection row.')
      }

      const rowID =
        args.mode === 'encode'
          ? assertID({ value: row.id })
          : decodeRowID({
              ...args,
              id: row.id,
              rowLogicalID: getRecord({ value: row[branchProjectionMetadataField] })?.logicalID,
            })
      const rowKey = JSON.stringify(rowID)

      if (seen.has(rowKey)) {
        throw new Error('Duplicate logical row ID in branch projection.')
      }
      seen.add(rowKey)

      const block =
        field.type === 'blocks'
          ? field.blocks
              .map((reference) =>
                typeof reference === 'string'
                  ? args.blocks.find(({ slug }) => slug === reference)
                  : reference,
              )
              .find((block) => block?.slug === row.blockType)
          : undefined

      if (field.type === 'blocks' && !block) {
        throw new Error('Unknown block in branch projection document.')
      }

      const rowFields = block?.fields ?? (field.type === 'array' ? field.fields : [])
      const idField = rowFields.find((field) => 'name' in field && field.name === 'id')
      const expectedType = idField?.type === 'number' ? 'number' : 'string'
      const metadata = getRecord({ value: row[branchProjectionMetadataField] })

      if (typeof rowID !== expectedType) {
        throw new Error('Logical row ID type does not match the branch projection schema.')
      }
      if (args.mode === 'encode' && Object.hasOwn(row, branchProjectionMetadataField)) {
        throw new Error('Content collides with private branch projection row metadata.')
      }
      if (args.mode === 'decode' && (!metadata || metadata.logicalID !== rowID)) {
        throw new Error('Invalid private branch projection row metadata.')
      }

      const transformed = transformFields({
        ...args,
        data: row,
        fields: rowFields,
        path: [...args.path, rowID],
      })

      transformed.id =
        args.mode === 'encode'
          ? encodeTuple({ tuple: ['row', args.branchID, args.logicalID, args.path, rowID] })
          : rowID

      if (args.mode === 'encode') {
        transformed[branchProjectionMetadataField] = { logicalID: rowID }
      } else {
        delete transformed[branchProjectionMetadataField]
      }

      return transformed
    })
  }

  const record = getRecord({ value })

  if ('fields' in field && record) {
    return transformFields({ ...args, data: record, fields: field.fields })
  }

  return value
}

const decodeRowID = ({
  id,
  branchID,
  logicalID,
  path,
  rowLogicalID,
}: {
  id: unknown
  rowLogicalID: unknown
} & Pick<WalkArgs, 'branchID' | 'logicalID' | 'path'>): BranchHeadID => {
  const rowID = assertID({ value: rowLogicalID })
  if (id !== encodeTuple({ tuple: ['row', branchID, logicalID, path, rowID] })) {
    throw new Error('Invalid private branch projection row ID.')
  }
  return rowID
}

const transformRelationship = ({
  branchID,
  mode,
  projectionSlugs,
  relationTo,
  value,
}: {
  relationTo: string | string[]
  value: unknown
} & Pick<WalkArgs, 'branchID' | 'mode' | 'projectionSlugs'>): unknown => {
  if (Array.isArray(relationTo)) {
    const record = getRecord({ value })

    if (!record || typeof record.relationTo !== 'string') {
      throw new Error('Invalid polymorphic branch projection relationship.')
    }

    const sourceSlug =
      mode === 'encode'
        ? record.relationTo
        : (Object.keys(projectionSlugs).find(
            (slug) => projectionSlugs[slug] === record.relationTo,
          ) ?? record.relationTo)

    if (!relationTo.includes(sourceSlug)) {
      throw new Error('Unexpected branch projection relationship target.')
    }

    return {
      ...record,
      relationTo:
        mode === 'encode'
          ? Object.hasOwn(projectionSlugs, sourceSlug)
            ? projectionSlugs[sourceSlug]!
            : sourceSlug
          : sourceSlug,
      value: transformRelationship({
        branchID,
        mode,
        projectionSlugs,
        relationTo: sourceSlug,
        value: record.value,
      }),
    }
  }

  if (!Object.hasOwn(projectionSlugs, relationTo)) {
    return value
  }
  if (mode === 'encode') {
    return encodeBranchProjectionID({ branchID, logicalID: assertID({ value }) })
  }
  const record = getRecord({ value })
  const metadata = getRecord({ value: record?.[branchProjectionMetadataField] })
  if (!record || typeof record.id !== 'string' || !metadata) {
    throw new Error('Missing private joined relationship identity metadata.')
  }
  return decodeBranchProjectionID({
    id: record.id,
    branchID,
    logicalID: assertID({ value: metadata.logicalID }),
  }).logicalID
}
