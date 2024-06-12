import type { I18n } from '@payloadcms/translations'
import type { User } from 'payload/bundle'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/bundle'
import type { PaginatedDocs } from 'payload/database'

export type DefaultVersionsViewProps = {
  canAccessAdmin: boolean
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  data: Document
  editURL: string
  entityLabel: string
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  id: number | string
  limit: number
  user: User
  versionsData: PaginatedDocs<Document>
}
