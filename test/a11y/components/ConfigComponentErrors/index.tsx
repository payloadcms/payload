import type { ServerAdapter } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { ClientErrorControls } from './ClientErrorControls.js'

export function ConfigComponentErrors() {
  return (
    <ClientErrorControls>
      <section aria-label="Server component errors">
        {RenderServerComponent({ Component: BrokenServerComponent, importMap: {} })}
        {RenderServerComponent({ Component: BrokenAsyncServerComponent, importMap: {} })}
        {RenderServerComponent({ Component: ServerComponentWithBrokenDescendant, importMap: {} })}
        <p>Healthy server sibling</p>
      </section>
    </ClientErrorControls>
  )
}

export function ConfigComponentErrorsRedirect({ server }: { server: ServerAdapter }): never {
  return server.redirect('/admin/config-component-errors')
}

export function BrokenServerComponent(): React.ReactNode {
  throw new Error('Synchronous server component failed')
}

async function BrokenAsyncServerComponent(): Promise<React.ReactNode> {
  await Promise.resolve()

  throw new Error('Asynchronous server component failed')
}

function ServerComponentWithBrokenDescendant() {
  return <BrokenServerComponent />
}
