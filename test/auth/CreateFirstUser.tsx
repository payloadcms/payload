import type { AdminViewServerProps } from 'payload'

import { CreateFirstUserView } from '@payloadcms/ui/views/CreateFirstUser'
import React from 'react'

export async function CreateFirstUser(props: AdminViewServerProps) {
  const builtInView = await CreateFirstUserView(props)

  return (
    <>
      <div>
        <h1 id="custom-view-override">Custom CreateFirstUser View Override</h1>
      </div>
      {builtInView}
    </>
  )
}
