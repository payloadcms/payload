import type { Config, ServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import '@payloadcms/ui/scss/app.scss'
import React from 'react'

type Args = {
  readonly children: React.ReactNode
  readonly providers: Config['admin']['components']['providers']
  readonly serverProps: ServerProps
}

export function NestProviders({ children, providers, serverProps }: Args): React.ReactNode {
  return RenderServerComponent({
    clientProps: {
      children:
        providers.length > 1 ? (
          <NestProviders providers={providers.slice(1)} serverProps={serverProps}>
            {children}
          </NestProviders>
        ) : (
          children
        ),
    },
    Component: providers[0],
    serverProps,
  })
}
