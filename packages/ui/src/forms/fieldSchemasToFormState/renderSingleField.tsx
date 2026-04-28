import type { ImportMap, PayloadRequest, SanitizedConfig } from 'payload'
import type React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

type ComponentSlot =
  | 'afterInput'
  | 'beforeInput'
  | 'Description'
  | 'Error'
  | 'Field'
  | 'Label'
  | 'RowLabel'

type RenderSingleFieldArgs = {
  /** Module path/specifier of the component as recorded in the component index. */
  componentPath: string
  config: SanitizedConfig
  /** Field path, e.g. `posts.renderTracker`. Forwarded to the component as `path`/`schemaPath`. */
  fieldPath: string
  importMap: ImportMap
  req: PayloadRequest
  slot: ComponentSlot
}

/**
 * Renders a single component referenced by the component index, returning a
 * React element. Intentionally narrow: it does not walk the schema, build a
 * client field, load document data, or compute defaults. Callers that need
 * those concerns should layer them on top.
 */
export async function renderSingleField(args: RenderSingleFieldArgs): Promise<React.ReactNode> {
  const { componentPath, fieldPath, importMap, req } = args

  const clientProps = {
    path: fieldPath,
    schemaPath: fieldPath,
  }

  const serverProps = {
    i18n: req.i18n,
    payload: req.payload,
    req,
    user: req.user,
  }

  return RenderServerComponent({
    clientProps,
    Component: { path: componentPath },
    importMap,
    serverProps,
  })
}
