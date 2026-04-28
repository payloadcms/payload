import type { PayloadRequest } from 'payload'
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
