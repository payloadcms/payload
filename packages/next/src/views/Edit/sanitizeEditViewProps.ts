import type { EditViewProps, ServerSideEditViewProps } from 'payload/types'

export const sanitizeEditViewProps = (props: ServerSideEditViewProps) => {
  const clientSideProps = { ...props }
  delete clientSideProps.initPageResult.req
  delete clientSideProps.initPageResult.collectionConfig
  delete clientSideProps.initPageResult.globalConfig
  delete clientSideProps.searchParams
  return clientSideProps as EditViewProps
}
