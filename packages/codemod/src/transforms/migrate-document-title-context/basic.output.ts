import { useDocumentInfo, useDocumentTitle } from '@payloadcms/ui'

export const Mixed = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { title, setDocumentTitle } = useDocumentTitle()
  return { id, collectionSlug, title, setDocumentTitle }
}

export const OnlyTitle = () => {
  const { title } = useDocumentTitle()
  return title
}

export const Aliased = () => {
  const { id } = useDocumentInfo()
  const { title: docTitle } = useDocumentTitle()
  return { docTitle, id }
}
