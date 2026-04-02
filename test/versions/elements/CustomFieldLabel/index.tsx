'use client'
import { useDocumentInfo } from '@payloadcms/ui'

export const CustomFieldLabel = () => {
  const { data } = useDocumentInfo()

  return (
    <p id="custom-field-label">{`Value in DocumentInfoContext: ${data?.relationship || '<No value>'}`}</p>
  )
}
