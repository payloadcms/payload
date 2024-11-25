import React from 'react'
import { draftMode } from 'next/headers'

import { AdminBarClient } from './index.client'

export async function AdminBar() {
  const { isEnabled: isPreviewMode } = await draftMode()

  return (
    <AdminBarClient
      // id={page?.id} // TODO: is there any way to do this?!
      collection="pages"
      preview={isPreviewMode}
    />
  )
}
