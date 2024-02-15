import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import { User } from 'payload/auth'
import { I18n } from '@payloadcms/translations'

export type DefaultVersionsViewProps = {
  canAccessAdmin: boolean
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  data: Document
  versionsData: PaginatedDocs<Document>
  editURL: string
  entityLabel: string
  id: string | number
  user: User
  limit: number
  i18n: I18n
}
