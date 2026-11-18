'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

export const DocumentInfoData = () => {
  const { data } = useDocumentInfo()
  const titleIsValid = useFormFields(([fields]) => fields.title?.valid)

  return (
    <span
      data-document-data={JSON.stringify(data)}
      data-title-valid={titleIsValid}
      id="document-info-state"
    />
  )
}
