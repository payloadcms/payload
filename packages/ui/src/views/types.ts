import type { Permissions } from 'payload/auth'
import type { Payload, SanitizedConfig } from 'payload/types'
import { I18n } from '@payloadcms/translations'
import { EditViewProps } from 'payload/config'

export type ServerSideEditViewProps = EditViewProps & {
  payload: Payload
  config: SanitizedConfig
  searchParams: { [key: string]: string | string[] | undefined }
  i18n: I18n
  collectionConfig?: SanitizedConfig['collections'][0]
  globalConfig?: SanitizedConfig['globals'][0]
  params: {
    segments: string[]
    collection?: string
    global?: string
  }
  permissions: Permissions
}
