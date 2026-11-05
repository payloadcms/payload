import { useDocumentInfo } from '@payloadcms/ui'

export const Mixed = () => {
  const { id, collectionSlug, title, setDocumentTitle } = useDocumentInfo()
  return { id, collectionSlug, title, setDocumentTitle }
}

export const OnlyTitle = () => {
  const { title } = useDocumentInfo()
  return title
}

export const Aliased = () => {
  const { title: docTitle, id } = useDocumentInfo()
  return { docTitle, id }
}
