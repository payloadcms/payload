import React from 'react';
import { CollectionPermission, GlobalPermission } from '../../../../auth';
import { SanitizedCollectionConfig, TypeWithID, TypeWithTimestamps } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { PaginatedDocs } from '../../../../mongoose/types';
import { TypeWithVersion } from '../../../../versions/types';

export type Version = TypeWithVersion<any>

export type DocumentPermissions = null | GlobalPermission | CollectionPermission

export type ContextType = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  slug?: string
  id?: string | number
  preferencesKey?: string
  versions?: PaginatedDocs<Version>
  unpublishedVersions?: PaginatedDocs<Version>
  publishedDoc?: TypeWithID & TypeWithTimestamps & { _status?: string }
  getVersions: () => Promise<void>
  docPermissions: DocumentPermissions
  getDocPermissions: () => Promise<void>
}

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: string | number
  children?: React.ReactNode
}
