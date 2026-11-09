import type { core } from 'zod'

import { getTranslation } from '@payloadcms/translations'
import { fromJSONSchema } from 'zod'

import type { CollectionSlug, FlattenedField, GlobalSlug, PayloadRequest } from '../../index.js'
import type { EntityInputSchema } from './types.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { getCollectionInputSchema, getGlobalInputSchema } from './getEntityInputSchema.js'

export const validateCollectionData = ({
  slug,
  data,
  partial,
  req,
}: {
  data: Record<string, unknown>
  partial?: boolean
  req: PayloadRequest
  slug: CollectionSlug
}): void => {
  const schema = getCollectionInputSchema({
    collectionSlug: slug,
    req,
    shouldKeepDeprecatedProperties: true,
    shouldKeepNullableContainers: true,
  })

  validateEntityData({ slug, data, entity: 'collection', partial, req, schema })
}

export const validateGlobalData = ({
  slug,
  data,
  req,
}: {
  data: Record<string, unknown>
  req: PayloadRequest
  slug: GlobalSlug
}): void => {
  const schema = getGlobalInputSchema({
    globalSlug: slug,
    req,
    shouldKeepDeprecatedProperties: true,
    shouldKeepNullableContainers: true,
  })

  validateEntityData({ slug, data, entity: 'global', partial: true, req, schema })
}

const validateEntityData = ({
  slug,
  data,
  entity,
  partial,
  req,
  schema,
}: {
  data: Record<string, unknown>
  entity: 'collection' | 'global'
  partial?: boolean
  req: PayloadRequest
  schema: EntityInputSchema | null
  slug: string
}): void => {
  if (!schema) {
    return
  }

  const validationSchema = partial ? withoutRequired(schema) : schema
  const result = fromJSONSchema(validationSchema as Parameters<typeof fromJSONSchema>[0]).safeParse(
    data,
  )

  if (result.success) {
    return
  }

  throw new ValidationError({
    [entity]: slug,
    errors: getUsefulIssues(result.error.issues).map((issue) => ({
      label: getFieldLabel({ slug, data, entity, path: issue.path, req }),
      message: getValidationMessage({ data, issue, req }),
      path: formatDataPath(issue.path),
    })),
    req,
  })
}

const getValidationMessage = ({
  data,
  issue,
  req,
}: {
  data: Record<string, unknown>
  issue: core.$ZodIssue
  req: PayloadRequest
}): string => {
  const value = issue.path.reduce<unknown>((value, segment) => readValue({ segment, value }), data)

  if (issue.code === 'invalid_type') {
    if (value === null || value === undefined) {
      return req.t('validation:required')
    }

    if (issue.expected === 'number' || issue.expected === 'int') {
      return req.t('validation:enterNumber')
    }

    if (issue.expected === 'boolean') {
      return req.t('validation:trueOrFalse')
    }
  }

  if (issue.code === 'invalid_value') {
    return req.t('validation:invalidSelection')
  }

  return req.t('validation:invalidInput')
}

/** Resolve configured labels while retaining row numbers and the original machine-readable path. */
const getFieldLabel = ({
  slug,
  data,
  entity,
  path,
  req,
}: {
  data: Record<string, unknown>
  entity: 'collection' | 'global'
  path: PropertyKey[]
  req: PayloadRequest
  slug: string
}): string | undefined => {
  const config =
    entity === 'collection'
      ? req.payload.collections[slug]?.config
      : req.payload.config.globals.find((global) => global.slug === slug)
  let fields: FlattenedField[] = config?.flattenedFields ?? []
  let value: unknown = data
  const labels: string[] = []

  for (let index = 0; index < path.length; index++) {
    const segment = path[index]

    if (typeof segment !== 'string') {
      break
    }

    const field = fields.find((field) => field.name === segment)

    if (!field) {
      break
    }

    labels.push(getTranslation(field.label || field.name, req.i18n))
    value = readValue({ segment, value })

    if (field.type === 'array' || field.type === 'blocks') {
      const rowIndex = path[index + 1]

      if (typeof rowIndex !== 'number') {
        break
      }

      index++
      labels[labels.length - 1] += ` ${rowIndex + 1}`
      value = readValue({ segment: rowIndex, value })

      if (field.type === 'array') {
        fields = field.flattenedFields
      } else {
        const blockType = readValue({ segment: 'blockType', value })
        const block =
          req.payload.config.blocks?.find((block) => block.slug === blockType) ??
          field.blocks.find((block) => typeof block !== 'string' && block.slug === blockType)

        fields = block && typeof block !== 'string' ? block.flattenedFields : []
      }
    } else if ('flattenedFields' in field) {
      fields = field.flattenedFields
    } else {
      fields = []
    }
  }

  return labels.length ? labels.join(' > ') : undefined
}

const readValue = ({ segment, value }: { segment: PropertyKey; value: unknown }): unknown =>
  value && typeof value === 'object' ? (value as Record<PropertyKey, unknown>)[segment] : undefined

/** Updates and drafts accept partial data, including partial nested objects and array rows. */
const withoutRequired = (schema: EntityInputSchema): EntityInputSchema => {
  const {
    $defs,
    additionalProperties,
    anyOf,
    items,
    oneOf,
    properties,
    required: _required,
    ...partialSchema
  } = schema

  return {
    ...partialSchema,
    ...($defs ? { $defs: mapSchemaRecord($defs) } : {}),
    ...(typeof additionalProperties === 'object'
      ? { additionalProperties: withoutRequired(additionalProperties) }
      : additionalProperties !== undefined
        ? { additionalProperties }
        : {}),
    ...(anyOf ? { anyOf: anyOf.map(makeSchemaPartial) } : {}),
    ...(items
      ? {
          items: Array.isArray(items)
            ? items.map((item) => withoutRequired(item))
            : withoutRequired(items),
        }
      : {}),
    ...(oneOf ? { oneOf: oneOf.map(makeSchemaPartial) } : {}),
    ...(properties ? { properties: mapSchemaRecord(properties) } : {}),
  }
}

const makeSchemaPartial = (schema: boolean | EntityInputSchema): boolean | EntityInputSchema =>
  typeof schema === 'boolean' ? schema : withoutRequired(schema)

const mapSchemaRecord = <T extends boolean | EntityInputSchema>(
  schemas: Record<string, T>,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, makeSchemaPartial(schema)]),
  ) as Record<string, T>

/**
 * Zod keeps every failed recursive-union branch. Select the closest matching branch instead of
 * returning a very large error tree to CLI and MCP clients.
 */
const getUsefulIssues = (
  issues: core.$ZodIssue[],
  parentPath: PropertyKey[] = [],
): core.$ZodIssue[] => {
  const selectedIssues = issues.flatMap((issue) => {
    if (issue.code !== 'invalid_union') {
      return [{ ...issue, path: [...parentPath, ...issue.path] }]
    }

    const unionPath = [...parentPath, ...issue.path]
    const closestBranch = issue.errors
      .filter((branch) => branch.length > 0)
      .sort(compareIssueBranches)[0]

    return closestBranch
      ? getUsefulIssues(closestBranch, unionPath)
      : [{ ...issue, path: unionPath }]
  })
  const uniqueIssues = new Map<string, core.$ZodIssue>()

  for (const issue of selectedIssues) {
    const key = `${issue.path.map(String).join('.')}:${issue.message}`

    if (!uniqueIssues.has(key)) {
      uniqueIssues.set(key, issue)
    }
  }

  return [...uniqueIssues.values()].slice(0, 10)
}

const compareIssueBranches = (left: core.$ZodIssue[], right: core.$ZodIssue[]): number => {
  const discriminatorDifference = countDiscriminatorIssues(left) - countDiscriminatorIssues(right)

  if (discriminatorDifference !== 0) {
    return discriminatorDifference
  }

  const pathDepthDifference = getDeepestPath(right) - getDeepestPath(left)

  if (pathDepthDifference !== 0) {
    return pathDepthDifference
  }

  return left.length - right.length
}

const countDiscriminatorIssues = (issues: core.$ZodIssue[]): number =>
  issues.filter((issue) => {
    const field = issue.path.at(-1)

    return field === 'blockType' || field === 'relationTo' || field === 'type'
  }).length

const getDeepestPath = (issues: core.$ZodIssue[]): number =>
  Math.max(0, ...issues.map((issue) => issue.path.length))

const formatDataPath = (path: PropertyKey[]): string =>
  path.reduce<string>(
    (result, segment) =>
      typeof segment === 'number' ? `${result}[${segment}]` : `${result}.${String(segment)}`,
    'data',
  )
