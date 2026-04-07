import type { ComponentRenderer } from 'payload'

import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'

/**
 * TanStack Start component renderer.
 *
 * Since TanStack Start has no RSC, all components are treated as client components.
 * This is a thin wrapper around `RenderClientComponent` from `@payloadcms/ui`.
 *
 * Custom Payload components registered in the import map must be client-safe
 * (regular React components, not async server components).
 */
export const TanStackComponentRenderer: ComponentRenderer = (args) => {
  return RenderClientComponent(args)
}
