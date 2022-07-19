import React from 'react';
import { SanitizedCollectionConfig, TypeWithID, TypeWithTimestamps } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { PaginatedDocs } from '../../../../mongoose/types';
import { DocumentPreferences } from '../../../../preferences/types';
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
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  getVersions: () => Promise<void>
  preferences?: DocumentPreferences
}

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: string | number
  children?: React.ReactNode
}
