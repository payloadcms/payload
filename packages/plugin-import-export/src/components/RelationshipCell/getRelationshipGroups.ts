import type { I18n } from '@payloadcms/translations'
import type { ClientCollectionConfig, SanitizedConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatDocTitle } from '@payloadcms/ui/shared'

/**
 * Labels rendered per collection before the rest collapse into `and N more`,
 * matching `totalToShow` in the list view's relationship cell.
 */
export const TOTAL_TO_SHOW = 3

type Args = {
  collections: ClientCollectionConfig[]
  dateFormat: SanitizedConfig['admin']['dateFormat']
  i18n: I18n<any, any>
  /** `field.relationTo` — an array when the field is polymorphic. */
  relationTo: string | string[]
  value: unknown
}

export type RelationshipGroup = {
  /** Plural label of the target collection, empty when it cannot be determined. */
  label: string
  /** One rendered label per document, capped at `TOTAL_TO_SHOW`. */
  options: string[]
  /** Options past `TOTAL_TO_SHOW` dropped from this group, to render as `and N more`. */
  remaining: number
}

/**
 * Groups a relationship or upload value by target collection — one group per
 * collection, labeled with its plural label, holding one label per document.
 *
 * Import files carry relationships in whichever shape produced them, so every
 * entry is one of: a bare ID, a populated document, or the polymorphic
 * `{ relationTo, value }` pair — whose `value` is itself an ID or a document.
 *
 * Each group caps at `TOTAL_TO_SHOW` options and counts the rest into `remaining`,
 * so a polymorphic field shows the same depth per collection rather than spending
 * one cell's worth of rows on whichever collection happens to come first. Groups are
 * returned in the order their collection first appears, and entries whose collection
 * cannot be determined collect into a single unlabeled group. Options keep their order
 * in the file rather than being sorted, so the preview reflects what will be imported.
 */
export const getRelationshipGroups = ({
  collections,
  dateFormat,
  i18n,
  relationTo,
  value,
}: Args): RelationshipGroup[] => {
  const entries = Array.isArray(value) ? value : [value]
  const configsBySlug = new Map(collections.map((collection) => [collection.slug, collection]))

  // Insertion order is the order each collection first appears, which is the order to render.
  const groupsBySlug = new Map<string, RelationshipGroup>()

  entries.forEach((entry) => {
    const { slug, target } = resolveEntry({ entry, relationTo })

    const key = slug ?? ''
    let group = groupsBySlug.get(key)

    if (!group) {
      group = {
        label: slug ? getTranslation(configsBySlug.get(slug)?.labels?.plural || slug, i18n) : '',
        options: [],
        remaining: 0,
      }

      groupsBySlug.set(key, group)
    }

    // Past the cap only the count matters, so skip the cost of titling the document.
    if (group.options.length < TOTAL_TO_SHOW) {
      group.options.push(
        getOptionLabel({
          collectionConfig: slug ? configsBySlug.get(slug) : undefined,
          dateFormat,
          entry,
          i18n,
          target,
        }),
      )
    } else {
      group.remaining++
    }
  })

  return [...groupsBySlug.values()]
}

/**
 * Splits an entry into the collection it targets — `undefined` when that cannot be
 * determined — and the ID or document it points at.
 */
const resolveEntry = ({
  entry,
  relationTo,
}: { entry: unknown } & Pick<Args, 'relationTo'>): { slug?: string; target: unknown } => {
  if (isPolymorphicRelationship(entry)) {
    return { slug: entry.relationTo, target: entry.value }
  }

  return { slug: Array.isArray(relationTo) ? undefined : relationTo, target: entry }
}

type GetOptionLabelArgs = {
  collectionConfig?: ClientCollectionConfig
  /** The original entry, kept for the JSON fallback when `target` holds no usable ID. */
  entry: unknown
  target: unknown
} & Pick<Args, 'dateFormat' | 'i18n'>

const getOptionLabel = ({
  collectionConfig,
  dateFormat,
  entry,
  i18n,
  target,
}: GetOptionLabelArgs): string => {
  const doc = isRecord(target) ? target : undefined
  const id = doc ? doc.id : target

  // Fall back to JSON for anything that did not resolve to a usable ID. Interpolating an
  // object into a template is the `[object Object]` this function exists to avoid.
  if (typeof id !== 'string' && typeof id !== 'number') {
    return JSON.stringify(entry) ?? ''
  }

  if (!doc) {
    // A bare ID carries no document to title. Showing the ID alone is more honest than
    // the field's `Untitled` fallback, which would assert the document has no title.
    return `${id}`
  }

  return formatDocTitle({
    collectionConfig,
    data: doc as Parameters<typeof formatDocTitle>[0]['data'],
    dateFormat,
    fallback: `${i18n.t('general:untitled')} - ID: ${id}`,
    i18n,
  })
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPolymorphicRelationship = (
  value: unknown,
): value is { relationTo: string; value: unknown } =>
  isRecord(value) && typeof value.relationTo === 'string' && 'value' in value
