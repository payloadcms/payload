import { useDocumentInfo } from '@payloadcms/ui'

export const Untouched = () => {
  const { id, collectionSlug } = useDocumentInfo()
  return { id, collectionSlug }
}

const customHook = () => ({ title: 'x', setDocumentTitle: (_: string) => {} })

export const FromOtherHook = () => {
  const { title, setDocumentTitle } = customHook()
  return { title, setDocumentTitle }
}
