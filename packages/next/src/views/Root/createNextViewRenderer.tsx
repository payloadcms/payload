import type { ViewComponentRenderer } from '@payloadcms/ui/utilities/createViewRenderer'
import type { ImportMap } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

export const createNextViewRenderer = ({
  importMap,
}: {
  importMap: ImportMap
}): ViewComponentRenderer => {
  return ({ clientProps, Component, Fallback, key, serverProps }) =>
    RenderServerComponent({
      clientProps,
      Component,
      Fallback,
      importMap,
      key,
      serverProps,
    })
}
