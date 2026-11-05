'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export const RefreshPermissions = () => {
  const { getDocPermissions } = useDocumentInfo()

  return (
    <button onClick={() => void getDocPermissions()} type="button">
      Refresh document permissions
    </button>
  )
}
