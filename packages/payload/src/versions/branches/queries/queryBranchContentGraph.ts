import type { FindArgs } from '../../../database/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { collectBranchReadGraph } from './collectBranchReadGraph.js'
import { queryBranchContent } from './queryBranchContent.js'
import { selectBranchQueryData } from './selectBranchQueryData.js'

type Coordinate = { collection: string; id: number | string }
type RawDocument = Record<string, unknown>

/**
 * Freeze the bounded raw forward graph before population or document hooks run.
 * Every requested relation gets either its authorized raw document or explicit
 * null. Population must use graph.get; an uncollected key never falls through.
 */
export const queryBranchContentGraph = async ({
  depth = 0,
  ...args
}: {
  branchID: BranchHeadID
  collection: string
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
} & Omit<FindArgs, 'collection' | 'req'>) => {
  if (
    !Number.isSafeInteger(depth) ||
    depth < 0 ||
    depth > (args.req.payload.config?.maxDepth ?? 10)
  ) {
    throw unsupported()
  }

  return collectBranchReadGraph({
    branchID: args.branchID,
    locale: args.locale,
    read: async ({ remember, rememberOwned, req }) => {
      // Selecting away a relationship before collection would allow a later
      // population stage to issue an untracked read. Traverse complete raw rows.
      const { select, ...rawArgs } = args
      const result = await queryBranchContent({ ...rawArgs, req })
      const known = new Set<string>()
      const key = ({ id, collection }: Coordinate) => JSON.stringify([collection, typeof id, id])
      let frontier = result.docs.map((doc) => ({
        collection: args.collection,
        doc: doc as RawDocument,
      }))

      for (let level = 0; level <= depth; level++) {
        for (const { collection, doc } of frontier) {
          if (
            level === 0 &&
            req.payload.collections[collection]?.config.custom?.branchQueryGlobalSource
          ) {
            continue
          }
          const id = readID({ value: doc.id })
          if (!known.has(key({ id, collection }))) {
            remember({ id, collection, doc })
            known.add(key({ id, collection }))
          }
        }
        if (level === depth || frontier.length === 0) {
          break
        }
        const grouped = new Map<string, Map<string, number | string>>()

        for (const { collection, doc } of frontier) {
          const config = req.payload.collections[collection]?.config

          if (!config) {
            throw unsupported()
          }
          for (const coordinate of collectReferences({
            data: doc,
            fields: config.fields,
            level,
            locale:
              args.locale ??
              req.locale ??
              (req.payload.config.localization
                ? req.payload.config.localization.defaultLocale
                : undefined),
            req,
          })) {
            if (known.has(key(coordinate))) {
              continue
            }
            const ids = grouped.get(coordinate.collection) ?? new Map<string, number | string>()

            ids.set(key(coordinate), coordinate.id)
            grouped.set(coordinate.collection, ids)
          }
        }
        frontier = []
        for (const [collection, ids] of grouped) {
          const entries = [...ids.values()]

          // Native SQL variable and D1 binding bounds remain explicit. This
          // batches only references of the already selected bounded root page.
          for (let start = 0; start < entries.length; start += 50) {
            const requested = entries.slice(start, start + 50)
            const related = await queryBranchContent({
              branchID: args.branchID,
              collection,
              limit: 0,
              locale: args.locale,
              overrideAccess: args.overrideAccess,
              pagination: false,
              req,
              where: { id: { in: requested } },
            })
            const returned = new Map(
              related.docs.map((doc) => [key({ id: readID({ value: doc.id }), collection }), doc]),
            )

            for (const id of requested) {
              const coordinate = { id, collection }
              const doc = returned.get(key(coordinate)) as RawDocument | undefined

              // Native related rows belong exclusively to this callback. Unlike root
              // rows, they never escape in result.docs, and traversal does not mutate
              // them. Transfer their ownership; graph.get still isolates every read.
              rememberOwned({ ...coordinate, doc: doc ?? null })
              known.add(key(coordinate))
              if (doc) {
                frontier.push({ collection, doc })
              }
            }
          }
        }
      }
      return {
        ...result,
        docs: result.docs.map((data) =>
          selectBranchQueryData({
            blocks: req.payload.config.blocks,
            data,
            fields: req.payload.collections[args.collection]?.config.fields,
            select,
          }),
        ),
      }
    },
    req: args.req,
  })
}

/** Schema traversal deliberately excludes opaque JSON and rich text bodies. */
const collectReferences = ({
  data,
  fields,
  level,
  locale,
  req,
}: {
  data: RawDocument
  fields: Field[]
  level: number
  locale?: string
  req: PayloadRequest
}): Coordinate[] => {
  const result: Coordinate[] = []
  const record = ({ value }: { value: unknown }): RawDocument | undefined =>
    value != null && typeof value === 'object' && !Array.isArray(value)
      ? (value as RawDocument)
      : undefined
  const add = ({ collection, value }: { collection: string; value: unknown }) => {
    if (value == null) {
      return
    }
    const id = readID({ value: record({ value })?.id ?? value })

    result.push({ id, collection })
  }
  const visit = ({
    data,
    fields,
    localized,
  }: {
    data: RawDocument
    fields: Field[]
    localized: boolean
  }) => {
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) {
            walk({ field: { ...tab, type: 'group' } as Field, localized, value: data[tab.name] })
          } else {
            visit({ data, fields: tab.fields, localized })
          }
        }
      } else if (!('name' in field)) {
        if ('fields' in field) {
          visit({ data, fields: field.fields, localized })
        }
      } else {
        walk({ field, localized, value: data[field.name] })
      }
    }
  }
  const walk = ({
    field,
    localized,
    value,
  }: {
    field: Field
    localized: boolean
    value: unknown
  }) => {
    if (value == null) {
      return
    }
    if ('localized' in field && field.localized && !localized && record({ value })) {
      const values = record({ value })!
      if (locale === 'all') {
        for (const entry of Object.values(values)) {
          walk({ field, localized: true, value: entry })
        }
      } else {
        const selected = locale ? values[locale] : undefined
        let effective = selected
        if (selected == null && req.fallbackLocale && req.fallbackLocale !== locale) {
          const fallbacks = Array.isArray(req.fallbackLocale)
            ? req.fallbackLocale
            : [req.fallbackLocale]
          const fallback = fallbacks
            .map((locale) => values[locale])
            .find((value) => value !== undefined && value !== null && value !== '')
          if (fallback !== undefined) {
            effective = fallback
          }
        }
        walk({ field, localized: true, value: effective })
      }
      return
    }
    if (field.type === 'relationship' || field.type === 'upload' || field.type === 'join') {
      if ('maxDepth' in field && typeof field.maxDepth === 'number' && level + 1 > field.maxDepth) {
        return
      }
      const target = field.type === 'join' ? field.collection : field.relationTo
      const source = field.type === 'join' && record({ value }) ? record({ value })!.docs : value

      for (const item of Array.isArray(source) ? source : [source]) {
        if (typeof target === 'string') {
          add({ collection: target, value: item })
        } else if (record({ value: item })) {
          const relation = record({ value: item })!

          if (typeof relation.relationTo !== 'string' || !target.includes(relation.relationTo)) {
            throw unsupported()
          }
          add({ collection: relation.relationTo, value: relation.value })
        } else if (item != null) {
          throw unsupported()
        }
      }
    } else if ((field.type === 'array' || field.type === 'blocks') && Array.isArray(value)) {
      for (const row of value) {
        if (!record({ value: row })) {
          throw unsupported()
        }
        const block =
          field.type === 'blocks'
            ? field.blocks
                .map((block) => (typeof block === 'string' ? req.payload.blocks[block] : block))
                .find((block) => block?.slug === record({ value: row })!.blockType)
            : undefined
        const nested = field.type === 'array' ? field.fields : block?.fields

        if (!nested) {
          throw unsupported()
        }
        visit({ data: record({ value: row })!, fields: nested, localized })
      }
    } else if ('fields' in field && record({ value })) {
      visit({ data: record({ value })!, fields: field.fields, localized })
    }
  }

  visit({ data, fields, localized: false })
  return result
}

const readID = ({ value }: { value: unknown }): number | string => {
  if (
    (typeof value === 'string' && value.length > 0) ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value
  }
  throw unsupported()
}
const unsupported = () =>
  Object.assign(
    new Error(
      'The branch population graph is incomplete or exceeds its supported snapshot budget.',
    ),
    { code: 'branch-read-snapshot-unsupported' },
  )
