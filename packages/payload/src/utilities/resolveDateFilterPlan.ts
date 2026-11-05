import type { SanitizedConfig } from '../config/types.js'
import type { DateField, FlattenedField } from '../fields/config/types.js'
import type { Operator } from '../types/index.js'
import type { DateFilterInput } from './dateOnlyFilter.js'

import { APIError } from '../errors/APIError.js'
import { fieldShouldBeLocalized } from '../fields/config/types.js'
import { classifyDateFilterInput, isDateOnlyPickerAppearance } from './dateOnlyFilter.js'

export type ResolvedDatePathSegment = {
  blockSlug?: string
  collectionSlug?: string
  isLocalized: boolean
  isRepeated: boolean
  locale?: string
  name: string
  type: FlattenedField['type']
}

export type ResolvedDateFilterTarget = {
  field: DateField
  lineage: ResolvedDatePathSegment[]
}

export type ResolvedDateFilterPlan = {
  input: DateFilterInput
  operator: Operator
  pickerAppearance?: string
  requestLocale?: string
  targets: ResolvedDateFilterTarget[]
  timezone: string
}

/**
 * Resolves a calendar-day filter path to every matching date field and its effective timezone.
 * Ambiguous paths with incompatible field configurations are rejected before adapter lowering.
 */
export const resolveDateFilterPlan = ({
  config,
  fields,
  locale,
  operator,
  parentIsLocalized,
  path,
  value,
}: {
  config: SanitizedConfig
  fields: FlattenedField[]
  locale?: string
  operator: Operator
  parentIsLocalized: boolean
  path: string
  value: unknown
}): ResolvedDateFilterPlan | undefined => {
  const result = findDateFilterTargets({
    config,
    fields,
    lineage: [],
    locale,
    parentIsLocalized,
    pathSegments: path.split('.'),
  })

  if (!result.matches.length) {
    return undefined
  }

  const dateMatches = result.matches.filter(
    (match): match is ResolvedDateFilterTarget => match.field.type === 'date',
  )

  if (!dateMatches.length) {
    return undefined
  }

  const input = classifyDateFilterInput({ operator, value })

  if (input.kind !== 'calendarDay') {
    return undefined
  }

  if (dateMatches.length !== result.matches.length) {
    throw new APIError(
      `Cannot filter date path "${path}" because it resolves to both date and non-date fields.`,
      400,
    )
  }

  const targets = deduplicateTargets({ targets: dateMatches })
  const targetConfigurations = targets.map(({ field }) => ({
    pickerAppearance: field.admin?.date?.pickerAppearance ?? 'default',
    timezone: getEffectiveTimezone({ config, field }),
  }))

  if (
    targetConfigurations.every(
      ({ pickerAppearance }) => !isDateOnlyPickerAppearance({ pickerAppearance }),
    )
  ) {
    return undefined
  }

  const firstConfiguration = targetConfigurations[0]!
  const hasConflict = targetConfigurations.some(
    (configuration) =>
      !isDateOnlyPickerAppearance({ pickerAppearance: configuration.pickerAppearance }) ||
      configuration.timezone !== firstConfiguration.timezone,
  )

  if (hasConflict) {
    throw new APIError(
      `Cannot filter calendar-day path "${path}" because its block fields use conflicting date configurations.`,
      400,
    )
  }

  return {
    input,
    operator,
    pickerAppearance: firstConfiguration.pickerAppearance,
    requestLocale: locale,
    targets,
    timezone: firstConfiguration.timezone,
  }
}

type FieldMatch = {
  field: FlattenedField
  lineage: ResolvedDatePathSegment[]
}

const findDateFilterTargets = ({
  config,
  fields,
  lineage,
  locale,
  parentIsLocalized,
  pathSegments,
}: {
  config: SanitizedConfig
  fields: FlattenedField[]
  lineage: ResolvedDatePathSegment[]
  locale?: string
  parentIsLocalized: boolean
  pathSegments: string[]
}): { matches: FieldMatch[] } => {
  const [fieldName, ...remainingPath] = pathSegments
  const field = fields.find((candidate) => candidate.name === fieldName)

  if (!field) {
    return { matches: [] }
  }

  const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })
  const explicitLocale =
    isLocalized && config.localization
      ? config.localization.localeCodes.find((localeCode) => localeCode === remainingPath[0])
      : undefined
  const resolvedLocale = explicitLocale ?? (locale !== 'all' ? locale : undefined)
  const remainingFieldPath = explicitLocale ? remainingPath.slice(1) : remainingPath
  const segment: ResolvedDatePathSegment = {
    name: field.name,
    type: field.type,
    isLocalized,
    isRepeated:
      field.type === 'array' ||
      field.type === 'blocks' ||
      field.type === 'join' ||
      ((field.type === 'relationship' || field.type === 'upload') && Boolean(field.hasMany)),
    locale: isLocalized ? resolvedLocale : undefined,
  }

  if (!remainingFieldPath.length) {
    return { matches: [{ field, lineage: [...lineage, segment] }] }
  }

  if (field.type === 'blocks') {
    const explicitBlockSlug = remainingFieldPath[0]
    const configuredBlocks = field.blocks.flatMap((blockReference) => {
      if (typeof blockReference !== 'string') {
        return [blockReference]
      }

      const block = config.blocks.find(({ slug }) => slug === blockReference)

      return block ? [block] : []
    })
    const explicitBlock = configuredBlocks.find(({ slug }) => slug === explicitBlockSlug)
    const blockPath = explicitBlock ? remainingFieldPath.slice(1) : remainingFieldPath
    const blocks = explicitBlock ? [explicitBlock] : configuredBlocks
    const blockResults = blocks.map((block) =>
      findDateFilterTargets({
        config,
        fields: block.flattenedFields,
        lineage: [...lineage, { ...segment, blockSlug: block.slug }],
        locale,
        parentIsLocalized: parentIsLocalized || Boolean(field.localized),
        pathSegments: blockPath,
      }),
    )
    const matches = blockResults.flatMap((result) => result.matches)

    return { matches }
  }

  if (field.type === 'join' && typeof field.collection === 'string') {
    const collection = config.collections.find(({ slug }) => slug === field.collection)

    if (!collection) {
      return { matches: [] }
    }

    return findDateFilterTargets({
      config,
      fields: collection.flattenedFields,
      lineage: [...lineage, { ...segment, collectionSlug: field.collection }],
      locale,
      parentIsLocalized: false,
      pathSegments: remainingFieldPath,
    })
  }

  if (
    (field.type === 'relationship' || field.type === 'upload') &&
    typeof field.relationTo === 'string'
  ) {
    const collection = config.collections.find(({ slug }) => slug === field.relationTo)

    if (!collection) {
      return { matches: [] }
    }

    return findDateFilterTargets({
      config,
      fields: collection.flattenedFields,
      lineage: [
        ...lineage,
        {
          name: segment.name,
          type: segment.type,
          collectionSlug: field.relationTo,
          isLocalized: segment.isLocalized,
          isRepeated: segment.isRepeated,
          locale: segment.locale,
        },
      ],
      locale,
      parentIsLocalized: false,
      pathSegments: remainingFieldPath,
    })
  }

  if ('flattenedFields' in field) {
    return findDateFilterTargets({
      config,
      fields: field.flattenedFields,
      lineage: [...lineage, segment],
      locale,
      parentIsLocalized: parentIsLocalized || Boolean(field.localized),
      pathSegments: remainingFieldPath,
    })
  }

  return { matches: [] }
}

const deduplicateTargets = ({
  targets,
}: {
  targets: ResolvedDateFilterTarget[]
}): ResolvedDateFilterTarget[] => {
  const seen = new Set<string>()

  return targets.filter(({ lineage }) => {
    const key = lineage
      .map(({ name, blockSlug, collectionSlug, locale }) =>
        [name, blockSlug, collectionSlug, locale].join(':'),
      )
      .join('.')

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const getEffectiveTimezone = ({
  config,
  field,
}: {
  config: SanitizedConfig
  field: DateField
}): string =>
  (typeof field.timezone === 'object'
    ? field.timezone.defaultTimezone
    : field.timezone && config.admin.timezones.defaultTimezone) || 'UTC'
