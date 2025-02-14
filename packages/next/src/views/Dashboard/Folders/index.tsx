import type { groupNavItems } from '@payloadcms/ui/shared'
import type {
  ClientUser,
  PaginatedDocs,
  SanitizedPermissions,
  ServerProps,
  VisibleEntities,
} from 'payload'
import type { GetFolderDataResult } from 'payload/shared'

import { FolderAndDocuments, FolderProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import './index.scss'

const baseClass = 'folder-dashboard'

export type FolderDashboardProps = {
  documents: PaginatedDocs[]
  folderID?: number | string
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  Link: React.ComponentType<any>
  navGroups?: ReturnType<typeof groupNavItems>
  permissions: SanitizedPermissions
  visibleEntities: VisibleEntities
} & GetFolderDataResult &
  ServerProps

export const FolderDashboard: React.FC<FolderDashboardProps> = (props) => {
  const {
    breadcrumbs,
    documents,
    folderID,
    globalData,
    i18n,
    i18n: { t },
    items,
    Link,
    locale,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
        routes: { admin: adminRoute },
      },
    },
    payload,
    permissions,
    searchParams,
    user,
  } = props

  return (
    <FolderProvider
      initialData={{
        breadcrumbs,
        folderID,
        items,
      }}
    >
      <div className={baseClass}>
        <div className={`${baseClass}__wrap`}>
          {beforeDashboard &&
            RenderServerComponent({
              Component: beforeDashboard,
              importMap: payload.importMap,
              serverProps: {
                i18n,
                locale,
                params,
                payload,
                permissions,
                searchParams,
                user,
              },
            })}

          <FolderAndDocuments />
          {afterDashboard &&
            RenderServerComponent({
              Component: afterDashboard,
              importMap: payload.importMap,
              serverProps: {
                i18n,
                locale,
                params,
                payload,
                permissions,
                searchParams,
                user,
              },
            })}
        </div>
      </div>
    </FolderProvider>
  )
}
