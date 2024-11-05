import type { Config, ImportMap } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import '@payloadcms/ui/scss/app.scss'
import React from 'react'

type Args = {
  readonly children: React.ReactNode
  readonly importMap: ImportMap
  readonly providers: Config['admin']['components']['providers']
}
export function NestProviders({ children, importMap, providers }: Args): React.ReactNode {
  return (
    <RenderServerComponent
      clientProps={{
        children:
          providers.length > 1 ? (
            <NestProviders importMap={importMap} providers={providers.slice(1)}>
              {children}
            </NestProviders>
          ) : (
            children
          ),
      }}
      Component={providers[0]}
      importMap={importMap}
    />
  )
}
