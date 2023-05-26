import React from 'react'
import { draftMode } from 'next/headers'

import { AdminBarClient } from './client'

export async function AdminBar() {
  const { isEnabled: isPreviewMode } = draftMode()

  return (
    <AdminBarClient
      preview={isPreviewMode}
      // id={page?.id} // TODO: is there any way to do this?!
      collection="pages"
    />
  )
}
