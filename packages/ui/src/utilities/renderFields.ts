import type { PayloadRequest, ServerFunction } from 'payload'
import type { RenderFieldsRequest, RenderFieldsResponse } from 'payload/internal'

import { renderSingleField } from '../forms/fieldSchemasToFormState/renderSingleField.js'

type RenderFieldsArgs = {
  req: PayloadRequest
  request: RenderFieldsRequest
}

/**
 * Renders the components requested by `request.render` and returns their
 * React elements. Resolution is driven by `payload.config.componentIndex` —
 * this function does NOT walk the schema, load document data, or compute
 * defaults. Errors are isolated per target so a single failure does not
 * abort the batch.
 */
export async function renderFields(args: RenderFieldsArgs): Promise<RenderFieldsResponse> {
  const { req, request } = args
  const index = req.payload.config.componentIndex
  const importMap = req.payload.importMap

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

  for (const target of request.render) {
    try {
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

      const element = await renderSingleField({
        componentPath: matched.componentPath,
        fieldPath: matched.path,
        importMap,
        req,
      })

      rendered.push({ path: target.path, payload: element, slot: target.slot })
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
