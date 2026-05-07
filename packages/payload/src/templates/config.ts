import type { CollectionConfig } from '../collections/config/types.js'
import type { Config, SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { TemplateEntityType } from './types.js'

type ConfigLike = Config | SanitizedConfig

import { APIError } from '../errors/APIError.js'
import { isBlockSlugOptedIn, isCollectionOptedIn, isFieldOptedIn } from './getTemplatesEnabled.js'
import { resolveSchemaForEntity } from './resolveSchemaForEntity.js'
import { buildSchemaSnapshot, computeSchemaHash } from './schemaFingerprint.js'

export const templatesCollectionSlug = 'payload-templates'

/**
 * Internal collection backing the Templates API.
 *
 * Editors save documents, blocks, and field values here as reusable templates,
 * which are then applied at create-time via the `templateID` parameter.
 *
 * @see https://github.com/payloadcms/payload/discussions/16515
 */
export const getTemplatesCollection = (config: Config): CollectionConfig => ({
  slug: templatesCollectionSlug,
  admin: {
    defaultColumns: ['title', 'entityType', 'entitySlug', '_isStale', 'updatedAt'],
    hidden: true,
    useAsTitle: 'title',
  },
  endpoints: [
    {
      handler: async (req) => {
        const { resolveBlockOrFieldTemplate } = await import('./resolveBlockOrFieldTemplate.js')
        const id = (req.routeParams?.id ?? '') as string

        let body: { hostCollectionSlug?: string; hostFieldPath?: string } = {}
        if (req.data && typeof req.data === 'object') {
          body = req.data as typeof body
        } else {
          try {
            body = ((await req.json?.()) as typeof body) ?? {}
          } catch (_err) {
            body = {}
          }
          if (body && !req.data) {
            req.data = body
            // @ts-expect-error align with the body-parse convention used by other custom handlers
            req.json = () => Promise.resolve(body)
          }
        }

        if (!body.hostCollectionSlug) {
          return Response.json(
            { errors: [{ message: '`hostCollectionSlug` is required.' }] },
            { status: 400 },
          )
        }

        try {
          const data = await resolveBlockOrFieldTemplate({
            hostCollectionSlug: body.hostCollectionSlug,
            hostFieldPath: body.hostFieldPath,
            req,
            templateID: id,
          })
          return Response.json({ data })
        } catch (err) {
          const status = (err as { status?: number })?.status ?? 500
          const message = (err as { message?: string })?.message ?? 'Failed to resolve template.'
          return Response.json({ errors: [{ message }] }, { status })
        }
      },
      method: 'post',
      path: '/:id/resolve',
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'entityType',
      type: 'select',
      options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Block', value: 'block' },
        { label: 'Field', value: 'field' },
      ],
      required: true,
    },
    {
      name: 'entitySlug',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'data',
      type: 'json',
    },
    {
      name: 'schemaHash',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'schemaSnapshot',
      type: 'json',
      admin: {
        hidden: true,
      },
    },
    {
      name: '_isStale',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        req.context.isTemplate = true

        const captureFlag = req.context.captureFlag as ((flag: boolean) => void) | undefined
        captureFlag?.(true)
        const captureAccessFlag = req.context.captureAccessFlag as
          | ((flag: boolean) => void)
          | undefined
        captureAccessFlag?.(true)

        validateOptIn({ config: req.payload.config, data })

        // On collection beforeChange, `data` arrives merged with the existing doc, so
        // `data.schemaHash` is always populated. We treat the caller as having provided
        // an explicit hash override only when their incoming value differs from the
        // existing doc's hash (the common case: tests / system writes that want to
        // pin a specific stored hash).
        const callerOverridingHash =
          operation === 'update' &&
          originalDoc !== undefined &&
          originalDoc?.schemaHash !== data?.schemaHash

        if (!callerOverridingHash) {
          const snapshot = buildSnapshotForEntity({
            config: req.payload.config,
            entitySlug: data?.entitySlug,
            entityType: data?.entityType,
          })

          if (snapshot) {
            data.schemaHash = computeSchemaHash(snapshot)
            data.schemaSnapshot = snapshot

            if (operation === 'update') {
              const callerOverridingIsStale = originalDoc?._isStale !== data?._isStale
              if (!callerOverridingIsStale) {
                data._isStale = false
              }
            }
          }
        }

        const sourceFields = getSourceFields({
          config: req.payload.config,
          entitySlug: data?.entitySlug,
          entityType: data?.entityType,
        })

        const callerOverridingData =
          operation === 'create' ||
          (originalDoc !== undefined &&
            JSON.stringify(originalDoc?.data) !== JSON.stringify(data?.data))

        if (sourceFields && callerOverridingData && data?.data && typeof data.data === 'object') {
          if (Array.isArray(data.data)) {
            // Tier 3 (field) templates store an array of items / blocks. Run hooks
            // per-item so the array shape survives the round-trip.
            const items: unknown[] = []
            for (const item of data.data) {
              if (item && typeof item === 'object') {
                items.push(
                  await runBeforeSaveAsTemplateHooks({
                    fields: sourceFields,
                    req,
                    value: item as JsonObject,
                  }),
                )
              } else {
                items.push(item)
              }
            }
            data.data = items
          } else {
            data.data = await runBeforeSaveAsTemplateHooks({
              fields: sourceFields,
              req,
              value: data.data as JsonObject,
            })
          }
        }

        return data
      },
    ],
  },
  lockDocuments: false,
})

function validateOptIn({
  config,
  data,
}: {
  config: ConfigLike
  data: { entitySlug?: string; entityType?: string }
}) {
  if (!data?.entityType || !data?.entitySlug) {
    return
  }

  switch (data.entityType) {
    case 'block': {
      if (!isBlockSlugOptedIn(data.entitySlug, config)) {
        throw new APIError(
          `Block "${data.entitySlug}" is not part of any opted-in blocks field. Add \`templates: true\` to a blocks field that contains it.`,
          400,
        )
      }
      break
    }
    case 'collection': {
      if (!isCollectionOptedIn(data.entitySlug, config)) {
        throw new APIError(
          `Collection "${data.entitySlug}" has not opted in to the Templates API. Add \`templates: true\` to its config to enable it.`,
          400,
        )
      }
      break
    }
    case 'field': {
      const [hostCollectionSlug, ...rest] = data.entitySlug.split('.')
      const dotPath = rest.join('.')
      if (!hostCollectionSlug || !dotPath) {
        throw new APIError(
          `Field template entitySlug must be of the form "<collection>.<field-path>"; received "${data.entitySlug}".`,
          400,
        )
      }
      if (!isFieldOptedIn(hostCollectionSlug, dotPath, config)) {
        throw new APIError(
          `Field "${data.entitySlug}" has not opted in to field templates. Add \`templates: true\` to the field config.`,
          400,
        )
      }
      break
    }
    default:
      throw new APIError(
        `Unknown template entityType: "${data.entityType}". Expected "collection", "block", or "field".`,
        400,
      )
  }
}

function buildSnapshotForEntity({
  config,
  entitySlug,
  entityType,
}: {
  config: ConfigLike
  entitySlug?: string
  entityType?: string
}): undefined | unknown[] {
  if (!entityType || !entitySlug) {
    return undefined
  }
  const resolved = resolveSchemaForEntity({
    config,
    entitySlug,
    entityType: entityType as TemplateEntityType,
  })
  if (!resolved) {
    return undefined
  }
  return buildSchemaSnapshot(resolved.fields)
}

function getSourceFields({
  config,
  entitySlug,
  entityType,
}: {
  config: ConfigLike
  entitySlug?: string
  entityType?: string
}): Field[] | undefined {
  if (!entityType || !entitySlug) {
    return undefined
  }
  const resolved = resolveSchemaForEntity({
    config,
    entitySlug,
    entityType: entityType as TemplateEntityType,
  })
  return resolved?.fields
}

type BeforeTemplateHook = (args: {
  field: Field
  req: PayloadRequest
  siblingData: JsonObject
  value: unknown
}) => Promise<unknown> | unknown

async function runBeforeSaveAsTemplateHooks({
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

    const hooks = (field as { hooks?: { beforeSaveAsTemplate?: BeforeTemplateHook[] } }).hooks
      ?.beforeSaveAsTemplate

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
      currentValue = next
    }

    if (currentValue === undefined) {
      delete result[field.name]
    } else {
      result[field.name] = currentValue
    }
  }

  return result
}
