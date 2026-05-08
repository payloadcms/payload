import type { ImportMap, PayloadComponent } from 'payload'

import { getFromImportMap, isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

/**
 * Renders a Payload server component on-demand using TanStack Start's RSC runtime.
 * Use this in `createServerFn` handlers when you need to render a server component
 * outside of the initial page data fetch (e.g. for drawers, dynamic widgets).
 *
 * Returns `null` if the component is not found or is not a server component.
 */
export async function renderPayloadComponentOnServer({
  componentPath,
  importMap,
  props,
}: {
  componentPath: PayloadComponent
  importMap: ImportMap
  props: Record<string, unknown>
}): Promise<null | React.ReactNode> {
  const Component = getFromImportMap<React.ComponentType>({
    importMap,
    PayloadComponent: componentPath,
    schemaPath: '',
  })

  if (!Component) {
    return null
  }

  if (!isReactServerComponentOrFunction(Component)) {
    return null
  }

  const { renderServerComponent } = await import('@tanstack/react-start/rsc')

  return renderServerComponent(React.createElement(Component, props))
}
