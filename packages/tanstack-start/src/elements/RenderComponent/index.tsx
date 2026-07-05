import type { ComponentRenderer } from 'payload'

import { RenderRSCComponent } from '../../rsc/renderPayloadRSC.js'

/**
 * TanStack Start component renderer.
 *
 * Uses the RSC-aware renderer that passes `serverProps` to server components
 * (detected via `$$typeof` / `isReactServerComponentOrFunction`) and
 * `clientProps` only to client components.
 */
export const TanStackComponentRenderer: ComponentRenderer = (args) => {
  return RenderRSCComponent(args)
}
