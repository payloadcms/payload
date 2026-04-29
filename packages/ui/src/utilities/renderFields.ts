import type { Field, FieldState, PayloadRequest, ServerFunction } from 'payload'
import type { RenderFieldsRequest, RenderFieldsResponse } from 'payload/internal'

import { SLOT_TO_CUSTOM_COMPONENT_KEY } from '../forms/deriveRealized.js'
import { renderField } from '../forms/fieldSchemasToFormState/renderField.js'
import { getClientConfig } from './getClientConfig.js'
import { getClientSchemaMap } from './getClientSchemaMap.js'
import { getSchemaMap } from './getSchemaMap.js'

type RenderFieldsArgs = {
  req: PayloadRequest
  request: RenderFieldsRequest
}

/**
 * Renders the components requested by `request.render` and returns their
 * React elements. Each target carries an entity-slug-prefixed path (e.g.
 * `posts.title` or `arrays.serverArray.0.text`); the slug-stripped form
 * lives client-side in formState/visibility, the dispatcher in
 * `Edit/index.tsx` re-prefixes when sending the request.
 *
 * Rendering reuses `renderField` (the same code path used during initial
 * form-state construction) so server custom Field components receive the
 * full `clientField`, `field`, `fieldSchemaMap`, etc. without any new
 * server-side schema walking. Errors are isolated per target so a single
 * failure does not abort the batch.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function renderFields(args: RenderFieldsArgs): Promise<RenderFieldsResponse> {
  const { req, request } = args
  const index = req.payload.config.componentIndex

  const rendered: RenderFieldsResponse['rendered'] = []
  const errors: NonNullable<RenderFieldsResponse['errors']> = []

  if (!index) {
    for (const target of request.render) {
      errors.push({
        message: 'componentIndex not configured on payload.config',
        path: target.path,
        slot: target.slot,
      })
    }
    return errors.length > 0 ? { errors, rendered } : { rendered }
  }

  const collectionSlug = request.collectionSlug
  const globalSlug = request.globalSlug
  const entitySlug = collectionSlug ?? globalSlug

  if (!entitySlug) {
    for (const target of request.render) {
      errors.push({
        message: 'render-fields request missing collectionSlug/globalSlug',
        path: target.path,
        slot: target.slot,
      })
    }
    return { errors, rendered }
  }

  const schemaMap = getSchemaMap({
    collectionSlug,
    config: req.payload.config,
    globalSlug,
    i18n: req.i18n,
  })

  const clientConfig = getClientConfig({
    config: req.payload.config,
    i18n: req.i18n,
    importMap: req.payload.importMap,
    user: req.user,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: clientConfig,
    globalSlug,
    i18n: req.i18n,
    payload: req.payload,
    schemaMap,
  })

  for (const target of request.render) {
    try {
      // The component index already validates that *something* is registered
      // at this path/slot. We do an early lookup so unknown targets fail
      // fast with a clear message rather than landing in renderField.
      const matched = index
        .componentsAt(target.path)
        .find((c) => c.slot === target.slot && c.path === target.path)

      if (!matched) {
        errors.push({
          message: 'No registered component at path/slot',
          path: target.path,
          slot: target.slot,
        })
        continue
      }

      // `target.path` carries row indices (e.g. `arrays.serverArray.0.text`).
      // The schema map is keyed by schema-shape paths with numeric segments
      // collapsed (`arrays.serverArray.text`). Build the schema key here.
      const targetSegments = target.path.split('.')
      const schemaSegments = targetSegments.filter((seg) => !/^\d+$/.test(seg))
      const schemaPath = schemaSegments.join('.')

      // `buildFieldSchemaMap.traverseFields` stores the Field directly under
      // the schema path; the top-level entity entry is the only one with
      // `{ fields }` shape (set in buildFieldSchemaMap/index.ts).
      const resolvedField = schemaMap.get(schemaPath) as Field | undefined

      if (!resolvedField) {
        errors.push({
          message: `No field schema found at schemaPath: ${schemaPath}`,
          path: target.path,
          slot: target.slot,
        })
        continue
      }

      const fieldState: FieldState = {}
      // Strip the entity slug from `path` going into renderField — its
      // contract is collection-relative (matches what the dispatcher
      // ultimately keys into formState).
      const slugStrip = `${entitySlug}.`
      const renderPath = target.path.startsWith(slugStrip)
        ? target.path.slice(slugStrip.length)
        : target.path

      renderField({
        clientFieldSchemaMap: clientSchemaMap,
        collectionSlug: collectionSlug ?? '-',
        data: {},
        fieldConfig: resolvedField,
        fieldSchemaMap: schemaMap,
        fieldState,
        // Force `createClientField` rather than the schema-map lookup —
        // the lookup path requires a clientFieldSchemaMap key that
        // exactly matches `schemaPath`, which it doesn't always for
        // leaf fields under arrays/blocks. Creating directly from the
        // resolved Field config sidesteps that.
        forceCreateClientField: true,
        formState: {},
        indexPath: '',
        lastRenderedPath: '',
        operation: 'create',
        parentPath: '',
        parentSchemaPath: '',
        path: renderPath,
        permissions: true,
        preferences: { fields: {} },
        previousFieldState: undefined,
        renderAllFields: true,
        req,
        schemaPath,
        siblingData: {},
      })

      const customKey = SLOT_TO_CUSTOM_COMPONENT_KEY[target.slot]
      const payload = (fieldState.customComponents as Record<string, unknown> | undefined)?.[
        customKey
      ]

      if (payload === undefined) {
        errors.push({
          message: `renderField produced no ${target.slot} component`,
          path: target.path,
          slot: target.slot,
        })
        continue
      }

      rendered.push({ path: target.path, payload, slot: target.slot })
    } catch (err) {
      errors.push({
        message: err instanceof Error ? err.message : String(err),
        path: target.path,
        slot: target.slot,
      })
    }
  }

  return errors.length > 0 ? { errors, rendered } : { rendered }
}

/**
 * Server-action entry point for `renderFields`. The augmented `args` shape
 * is `RenderFieldsRequest ∪ DefaultServerFunctionArgs` — this handler
 * strips the auto-injected fields (`cookies`, `importMap`, `permissions`,
 * `req`) and forwards the client-supplied `RenderFieldsRequest` to
 * `renderFields`.
 *
 * Note on `locale`: `DefaultServerFunctionArgs.locale` (a `Locale` object,
 * resolved server-side from cookies/headers) overrides any client-supplied
 * `RenderFieldsRequest.locale` (a string slug) at the top level via the
 * spread in `handleServerFunctions`. `renderFields` itself doesn't consume
 * `request.locale` today (it's reserved for future doc-data plumbing), so
 * we forward whatever value is present without attempting to disambiguate.
 */
export const renderFieldsHandler: ServerFunction<
  RenderFieldsRequest,
  Promise<RenderFieldsResponse>
> = async (args) => {
  const { req } = args as { req: PayloadRequest } & RenderFieldsRequest
  const clientArgs = args as RenderFieldsRequest
  const request: RenderFieldsRequest = {
    collectionSlug: clientArgs.collectionSlug,
    documentId: clientArgs.documentId,
    fallbackLocale: clientArgs.fallbackLocale,
    globalSlug: clientArgs.globalSlug,
    locale: clientArgs.locale,
    render: clientArgs.render,
  }
  return renderFields({ req, request })
}
