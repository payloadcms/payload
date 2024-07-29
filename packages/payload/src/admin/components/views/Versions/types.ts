import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { PaginatedDocs } from '../../../../database/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { Version } from '../../utilities/DocumentInfo/types'

export type IndexProps = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: string
}

export type Props = IndexProps & {
  data: Version
  editURL: string
  entityLabel: string
  fetchURL: string
  id: string
  isLoading: boolean
  isLoadingVersions: boolean
  latestDraftVersion?: string
  latestPublishedVersion?: string
  versionsData: PaginatedDocs<Version>
}
