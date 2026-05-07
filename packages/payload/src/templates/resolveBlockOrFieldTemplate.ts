import type { Field } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { TemplateDocument } from './types.js'

import { APIError } from '../errors/APIError.js'
import { TemplateOutOfDateError } from '../errors/TemplateOutOfDate.js'
import { templatesCollectionSlug } from './config.js'
import { resolveSchemaForEntity } from './resolveSchemaForEntity.js'
import { buildSchemaSnapshot, computeSchemaHash } from './schemaFingerprint.js'

/**
 * Resolve a tier-2 (block) or tier-3 (field) template for client-side insertion
 * into a host document's form state. Fetches the template, validates it can be
 * applied into the requested host context, runs schema-drift detection,
 * executes `beforeApplyTemplate` field hooks, and disambiguates unique fields
 * + block IDs so the inserted value doesn't collide with prior applies.
 *
 * Tier 1 (collection) templates are NOT resolved here — they go through the
 * create operation via `?templateID=`.
 */
export async function resolveBlockOrFieldTemplate({
  hostCollectionSlug,
  hostFieldPath,
  req,
  templateID,
}: {
  /** Collection that the resolved value will be inserted into. */
  hostCollectionSlug: string
  /** Dot-path of the host field. Required for tier-3 (field) apply; optional
   * for tier-2 since the host's blocks fields are searched. */
  hostFieldPath?: string
  req: PayloadRequest
  templateID: number | string
}): Promise<JsonObject | unknown[]> {
  const template = (await req.payload.findByID({
    id: templateID,
    collection: templatesCollectionSlug,
    overrideAccess: true,
    req,
  })) as null | TemplateDocument

  if (!template) {
    throw new APIError(`Template with id "${templateID}" not found.`, 404)
  }

  if (template.entityType === 'collection') {
    throw new APIError(
      `Template "${template.title}" is a collection template; use the create operation with \`templateID\` instead.`,
      400,
    )
  }

  if (template._isStale === true) {
    throw new TemplateOutOfDateError({
      templateID: template.id,
      templateTitle: template.title,
    })
  }

  if (template.entityType === 'block') {
    return resolveBlockTemplate({
      hostCollectionSlug,
      hostFieldPath,
      req,
      template,
    })
  }

  if (template.entityType === 'field') {
    return resolveFieldTemplate({
      hostCollectionSlug,
      hostFieldPath,
      req,
      template,
    })
  }

  throw new APIError(`Unknown template entityType: "${template.entityType}".`, 400)
}

async function resolveBlockTemplate({
  hostCollectionSlug,
  hostFieldPath,
  req,
  template,
}: {
  hostCollectionSlug: string
  hostFieldPath?: string
  req: PayloadRequest
  template: TemplateDocument
}): Promise<JsonObject> {
  const sourceSchema = resolveSchemaForEntity({
    config: req.payload.config,
    entitySlug: template.entitySlug,
    entityType: 'block',
  })
  if (!sourceSchema) {
    throw new APIError(
      `Template "${template.title}" references block "${template.entitySlug}", which is not part of any opted-in blocks field.`,
      400,
    )
  }

  if (hostFieldPath) {
    const hostBlocksField = resolveSchemaForEntity({
      config: req.payload.config,
      entitySlug: `${hostCollectionSlug}.${hostFieldPath}`,
      entityType: 'field',
    })?.hostField
    if (!hostBlocksField || hostBlocksField.type !== 'blocks') {
      throw new APIError(
        `Field "${hostCollectionSlug}.${hostFieldPath}" is not a blocks field.`,
        400,
      )
    }
    const allowedBlockSlugs = (hostBlocksField.blocks ?? []).map((block) => block.slug)
    if (!allowedBlockSlugs.includes(template.entitySlug)) {
      throw new APIError(
        `Block "${template.entitySlug}" is not allowed in "${hostCollectionSlug}.${hostFieldPath}".`,
        400,
      )
    }
  }

  await assertCurrent({
    fields: sourceSchema.fields,
    req,
    template,
  })

  req.context.isTemplate = true

  const block = { ...((template.data ?? {}) as JsonObject) }
  delete block.id
  block.blockType = template.entitySlug

  const transformed = await runBeforeApplyTemplateHooks({
    fields: sourceSchema.fields,
    req,
    value: disambiguateUniqueFields({ fields: sourceSchema.fields, value: block }),
  })

  return transformed
}

async function resolveFieldTemplate({
  hostCollectionSlug,
  hostFieldPath,
  req,
  template,
}: {
  hostCollectionSlug: string
  hostFieldPath?: string
  req: PayloadRequest
  template: TemplateDocument
}): Promise<unknown[]> {
  const sourceSchema = resolveSchemaForEntity({
    config: req.payload.config,
    entitySlug: template.entitySlug,
    entityType: 'field',
  })
  if (!sourceSchema || !sourceSchema.hostField) {
    throw new APIError(
      `Template "${template.title}" references field "${template.entitySlug}", which is not opted in or no longer exists.`,
      400,
    )
  }

  if (hostFieldPath) {
    const expected = `${hostCollectionSlug}.${hostFieldPath}`
    if (template.entitySlug !== expected) {
      throw new APIError(
        `Template "${template.title}" was saved for "${template.entitySlug}" but is being applied to "${expected}".`,
        400,
      )
    }
  }

  const hostField = sourceSchema.hostField
  const items = Array.isArray(template.data) ? (template.data as unknown[]) : []

  await assertCurrent({
    fields: sourceSchema.fields,
    req,
    template,
  })

  req.context.isTemplate = true

  const subFields = getRowFields(hostField)

  const resolved: unknown[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const next = { ...(item as JsonObject) }
    delete next.id
    const transformed = await runBeforeApplyTemplateHooks({
      fields: subFields,
      req,
      value: disambiguateUniqueFields({ fields: subFields, value: next }),
    })
    resolved.push(transformed)
  }

  return resolved
}

function getRowFields(hostField: Field): Field[] {
  if (hostField.type === 'array') {
    return hostField.fields
  }
  if (hostField.type === 'blocks') {
    // Block rows have heterogeneous shape; we iterate per-block-type during hook
    // walking. For disambiguation we use the union of all allowed blocks' fields,
    // which is conservative but safe (clearing a unique field is always valid).
    const all: Field[] = []
    for (const block of hostField.blocks ?? []) {
      all.push(...block.fields)
    }
    return all
  }
  return []
}

async function assertCurrent({
  fields,
  req,
  template,
}: {
  fields: Field[]
  req: PayloadRequest
  template: TemplateDocument
}): Promise<void> {
  const liveSnapshot = buildSchemaSnapshot(fields)
  const liveHash = computeSchemaHash(liveSnapshot)

  if (liveHash === template.schemaHash) {
    return
  }

  await req.payload.update({
    id: template.id,
    collection: templatesCollectionSlug,
    data: { _isStale: true },
    overrideAccess: true,
  })

  throw new TemplateOutOfDateError({
    templateID: template.id,
    templateTitle: template.title,
  })
}

type BeforeTemplateHook = (args: {
  field: Field
  req: PayloadRequest
  siblingData: JsonObject
  value: unknown
}) => Promise<unknown> | unknown

async function runBeforeApplyTemplateHooks({
  fields,
  req,
  value,
}: {
  fields: Field[]
  req: PayloadRequest
  value: JsonObject
}): Promise<JsonObject> {
  const result: JsonObject = { ...value }

  for (const field of fields) {
    if (!('name' in field) || typeof field.name !== 'string') {
      continue
    }

    const hooks = (field as { hooks?: { beforeApplyTemplate?: BeforeTemplateHook[] } }).hooks
      ?.beforeApplyTemplate

    if (!hooks?.length) {
      continue
    }

    let currentValue = result[field.name]
    for (const hook of hooks) {
      const next = await hook({
        field,
        req,
        siblingData: result,
        value: currentValue,
      })
      if (next !== undefined) {
        currentValue = next
      }
    }
    result[field.name] = currentValue
  }

  return result
}

function disambiguateUniqueFields({
  fields,
  value,
}: {
  fields: Field[]
  value: JsonObject
}): JsonObject {
  const result: JsonObject = { ...value }
  for (const field of fields) {
    if ('name' in field && typeof field.name === 'string') {
      if ((field as { unique?: boolean }).unique) {
        const current = result[field.name]
        if (['code', 'text', 'textarea'].includes(field.type) && typeof current === 'string') {
          const suffix = Math.random().toString(36).slice(2, 7)
          result[field.name] = current ? `${current}-${suffix}` : undefined
        } else {
          delete result[field.name]
        }
      }
    }
  }
  return result
}
