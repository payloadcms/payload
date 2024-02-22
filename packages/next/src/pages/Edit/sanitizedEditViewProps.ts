import { ServerSideEditViewProps } from '@payloadcms/ui'
import { EditViewProps } from 'payload/config'

export const sanitizedEditViewProps = (props: ServerSideEditViewProps) => {
  const clientSideProps = { ...props }
  delete clientSideProps.payload
  delete clientSideProps.config
  delete clientSideProps.searchParams
  delete clientSideProps.i18n
  delete clientSideProps.collectionConfig
  delete clientSideProps.globalConfig

  return clientSideProps as EditViewProps
}
