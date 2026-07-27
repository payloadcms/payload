import type { I18n } from '@payloadcms/translations'
import type { RelationshipOption, RelationshipOptionGroup } from '@payloadcms/ui'
import type { ClientCollectionConfig, SanitizedConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatDocTitle } from '@payloadcms/ui/shared'

/**
 * Options rendered per collection before the rest collapse into `and N more`,
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
  /** Options past `TOTAL_TO_SHOW` dropped from this group, to render as `and N more`. */
  remaining: number
} & RelationshipOptionGroup

/**
 * Groups a relationship or upload value by target collection, mirroring the option
 * groups the Relationship field builds in `optionsReducer` — one group per
 * collection, labeled with its plural label, holding one option per document.
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

  const groups: RelationshipGroup[] = []
  const groupsBySlug = new Map<string, RelationshipGroup>()

  entries.forEach((entry) => {
    const key = getEntrySlug({ entry, relationTo }) ?? ''

    let group = groupsBySlug.get(key)

    if (!group) {
      const relatedConfig = collections.find((collection) => collection.slug === key)

      group = {
        label: key ? getTranslation(relatedConfig?.labels?.plural || key, i18n) : '',
        options: [],
        remaining: 0,
      }

      groupsBySlug.set(key, group)
      groups.push(group)
    }

    // Past the cap only the count matters, so skip the cost of titling the document.
    if (group.options.length < TOTAL_TO_SHOW) {
      group.options.push(buildOption({ collections, dateFormat, entry, i18n, relationTo }))
    } else {
      group.remaining++
    }
  })

  return groups
}

/** The collection an entry targets, or `undefined` when it cannot be determined. */
const getEntrySlug = ({
  entry,
  relationTo,
}: { entry: unknown } & Pick<Args, 'relationTo'>): string | undefined => {
  if (isPolymorphicRelationship(entry)) {
    return entry.relationTo
  }

  return Array.isArray(relationTo) ? undefined : relationTo
}

type BuildOptionArgs = { entry: unknown } & Omit<Args, 'value'>

const buildOption = ({
  collections,
  dateFormat,
  entry,
  i18n,
  relationTo,
}: BuildOptionArgs): RelationshipOption => {
  const entrySlug = getEntrySlug({ entry, relationTo })
  const target = isPolymorphicRelationship(entry) ? entry.value : entry

  const doc = isRecord(target) ? target : undefined
  const id = doc ? doc.id : target

  // Fall back to JSON for anything that did not resolve to a usable ID. Interpolating an
  // object into a template is the `[object Object]` this function exists to avoid.
  if (typeof id !== 'string' && typeof id !== 'number') {
    const json = JSON.stringify(entry) ?? ''

    return { allowEdit: false, label: json, relationTo: entrySlug, value: json }
  }

  if (!doc) {
    // A bare ID carries no document to title. Showing the ID alone is more honest than
    // the field's `Untitled` fallback, which would assert the document has no title.
    return { allowEdit: false, label: `${id}`, relationTo: entrySlug, value: id }
  }

  return {
    allowEdit: false,
    label: formatDocTitle({
      collectionConfig: collections.find((collection) => collection.slug === entrySlug),
      data: doc as Parameters<typeof formatDocTitle>[0]['data'],
      dateFormat,
      fallback: `${i18n.t('general:untitled')} - ID: ${id}`,
      i18n,
    }),
    relationTo: entrySlug,
    value: id,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPolymorphicRelationship = (
  value: unknown,
): value is { relationTo: string; value: unknown } =>
  isRecord(value) && typeof value.relationTo === 'string' && 'value' in value
