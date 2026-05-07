import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Field } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { TemplateDocument } from './types.js'

import { APIError } from '../errors/APIError.js'
import { TemplateOutOfDateError } from '../errors/TemplateOutOfDate.js'
import { templatesCollectionSlug } from './config.js'
import { buildSchemaSnapshot, computeSchemaHash } from './schemaFingerprint.js'

/**
 * Resolve a template by ID, run schema-drift detection, run `beforeApplyTemplate`
 * field hooks against the source schema, and return the merged data ready to be
 * overlaid against caller-provided data in the create operation.
 */
export async function applyTemplate({
  collection,
  data,
  req,
  templateID,
}: {
  collection: CollectionConfig | SanitizedCollectionConfig
  data: JsonObject
  req: PayloadRequest
  templateID: number | string
}): Promise<JsonObject> {
  const template = (await req.payload.findByID({
    id: templateID,
    collection: templatesCollectionSlug,
    overrideAccess: true,
    req,
  })) as null | TemplateDocument

  if (!template) {
    throw new APIError(`Template with id "${templateID}" not found.`, 404)
  }

  if (template.entityType !== 'collection') {
    throw new APIError(
      `Template "${template.title}" is a ${template.entityType} template; expected a collection template.`,
      400,
    )
  }

  if (template.entitySlug !== collection.slug) {
    throw new APIError(
      `Template "${template.title}" is for collection "${template.entitySlug}", not "${collection.slug}".`,
      400,
    )
  }

  if (template._isStale === true) {
    throw new TemplateOutOfDateError({
      templateID: template.id,
      templateTitle: template.title,
    })
  }

  await assertTemplateCurrent({ collection, req, template })

  req.context.isTemplate = true

  const captureFlag = req.context.captureFlag as ((flag: boolean) => void) | undefined
  captureFlag?.(true)

  const templateData = (template.data ?? {}) as JsonObject
  const disambiguatedTemplateData = disambiguateUniqueFields({
    fields: collection.fields,
    value: templateData,
  })
  const transformedTemplateData = await runBeforeApplyTemplateHooks({
    fields: collection.fields,
    req,
    value: disambiguatedTemplateData,
  })

  return {
    ...transformedTemplateData,
    ...data,
  }
}

/**
 * Make values for `unique: true` fields collision-resistant when applying a
 * template, so two applies of the same template don't fail on the unique
 * constraint. Mirrors the `setDefaultBeforeDuplicate` pattern but instead of
 * a translatable "- Copy" suffix, we append a short random discriminator so
 * the new value still validates as required.
 *
 * - Text-shaped fields (`text`, `textarea`, `code`): append `-<random>`.
 * - Other unique fields (`email`, `number`, `point`, `relationship`,
 *   `select`, `upload`): clear so the user supplies a fresh value.
 *
 * Walks containers (row / collapsible / group / tabs) so unique sub-fields
 * inside helpers like `slugField()` are caught.
 */
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
        continue
      }
      if (field.type === 'group') {
        const groupValue = (result[field.name] ?? {}) as JsonObject
        result[field.name] = disambiguateUniqueFields({ fields: field.fields, value: groupValue })
        continue
      }
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      const merged = disambiguateUniqueFields({ fields: field.fields, value: result })
      Object.assign(result, merged)
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && typeof tab.name === 'string') {
          const tabValue = (result[tab.name] ?? {}) as JsonObject
          result[tab.name] = disambiguateUniqueFields({
            fields: tab.fields,
            value: tabValue,
          })
        } else {
          const merged = disambiguateUniqueFields({ fields: tab.fields, value: result })
          Object.assign(result, merged)
        }
      }
    }
  }

  return result
}

/**
 * Compare the live source schema's hash against the template's stored hash.
 * If different, stamp `_isStale: true` on the template and throw.
 *
 * The stamp uses `overrideAccess: true` so it succeeds even when the applying
 * user has no update permission on `payload-templates`.
 */
async function assertTemplateCurrent({
  collection,
  req,
  template,
}: {
  collection: CollectionConfig | SanitizedCollectionConfig
  req: PayloadRequest
  template: TemplateDocument
}): Promise<void> {
  const liveSnapshot = buildSchemaSnapshot(collection.fields)
  const liveHash = computeSchemaHash(liveSnapshot)

  if (liveHash === template.schemaHash) {
    return
  }

  // Commit the stamp in its own transaction so the apply operation's rollback
  // doesn't wipe it out when we throw below.
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

/**
 * Walk the source schema's fields and run any field-level `beforeApplyTemplate`
 * hooks against the corresponding values in `value`. Hook return values replace
 * the field's value in the merged output.
 *
 * Currently handles top-level fields and tabs / row / collapsible / group containers
 * for completeness; deeper nested traversal lands as later tiers extend this helper.
 */
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
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if ('name' in tab && typeof tab.name === 'string') {
            const tabValue = (result[tab.name] ?? {}) as JsonObject
            result[tab.name] = await runBeforeApplyTemplateHooks({
              fields: tab.fields,
              req,
              value: tabValue,
            })
          } else {
            const merged = await runBeforeApplyTemplateHooks({
              fields: tab.fields,
              req,
              value: result,
            })
            Object.assign(result, merged)
          }
        }
      } else if (field.type === 'row' || field.type === 'collapsible') {
        const merged = await runBeforeApplyTemplateHooks({
          fields: field.fields,
          req,
          value: result,
        })
        Object.assign(result, merged)
      }
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

type BeforeTemplateHook = (args: {
  field: Field
  req: PayloadRequest
  siblingData: JsonObject
  value: unknown
}) => Promise<unknown> | unknown
