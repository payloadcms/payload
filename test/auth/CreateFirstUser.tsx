import type { AdminViewServerProps } from 'payload'

import React from 'react'

const CustomMarker = () => (
  <div>
    <h1 id="custom-view-override">Custom CreateFirstUser View Override</h1>
  </div>
)

/**
 * Async RSC wrapper used only in Next.js, where the component is called as a custom view override
 * and receives AdminViewServerProps.
 */
async function NextCreateFirstUser(props: AdminViewServerProps) {
  const { CreateFirstUserView } = await import('@payloadcms/next/views')
  const builtInView = await CreateFirstUserView(props)

  return (
    <>
      <CustomMarker />
      {builtInView}
    </>
  )
}

/**
 * Custom CreateFirstUser view component used in the auth test suite.
 *
 * Works in two rendering modes:
 * - Next.js (RSC): receives AdminViewServerProps, renders the built-in form alongside the custom marker.
 * - TanStack Start: receives optional data props; the framework adapter renders the built-in form
 *   separately, so this component only needs to render the custom marker.
 */
export function CreateFirstUser(props: { data?: unknown } | AdminViewServerProps) {
  if ('initPageResult' in props) {
    return <NextCreateFirstUser {...props} />
  }

  return <CustomMarker />
}
