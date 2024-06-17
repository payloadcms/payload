import type { EditViewProps, ServerSideEditViewProps } from 'payload'

export const sanitizeEditViewProps = (props: ServerSideEditViewProps): EditViewProps => {
  const clientSideProps = { ...props }
  delete clientSideProps.initPageResult.req
  delete clientSideProps.initPageResult.collectionConfig
  delete clientSideProps.initPageResult.globalConfig
  return clientSideProps as EditViewProps
}
