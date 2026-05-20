import type { Config, ImportMap, ServerProps } from 'payload'

import React from 'react'
import '@payloadcms/ui/scss/app.scss'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

type Args = {
  readonly children: React.ReactNode
  readonly importMap: ImportMap
  readonly providers: Config['admin']['components']['providers']
  readonly serverProps: ServerProps
}

export function NestProviders({
  children,
  importMap,
  providers,
  serverProps,
}: Args): React.ReactNode {
  return RenderServerComponent({
    clientProps: {
      children:
        providers.length > 1 ? (
          <NestProviders
            importMap={importMap}
            providers={providers.slice(1)}
            serverProps={serverProps}
          >
            {children}
          </NestProviders>
        ) : (
          children
        ),
    },
    Component: providers[0],
    importMap,
    serverProps,
  })
}
