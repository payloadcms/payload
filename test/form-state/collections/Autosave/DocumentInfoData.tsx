'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export const DocumentInfoData = () => {
  const { data } = useDocumentInfo()

  return <span data-document-data={JSON.stringify(data)} id="document-info-state" />
}
