import { SanitizedCollectionConfig, TypeWithID } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { PaginatedDocs } from '../../../../mongoose/types';
import { TypeWithVersion } from '../../../../versions/types';

export type Version = TypeWithVersion<any>

export type ContextType = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  type: 'global' | 'collection'
  id?: string | number
  preferencesKey?: string
  versions?: PaginatedDocs<Version>
  unpublishedVersions?: PaginatedDocs<Version>
  publishedDoc?: TypeWithID
  data: any
  getVersions: () => void
}

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  data: any
}
