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
import { type groupNavItems, sanitizeID } from '@payloadcms/ui/shared'
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

export const FolderDashboard: React.FC<FolderDashboardProps> = async (props) => {
  const {
    breadcrumbs,
    folderID,
    i18n,
    items,
    locale,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
      },
    },
    payload,
    permissions,
    searchParams,
    user,
  } = props

  const displayTypePref = (await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    where: {
      and: [
        {
          key: {
            equals: 'folder-view-display',
          },
        },
        {
          'user.relationTo': {
            equals: user.collection,
          },
        },
        {
          'user.value': {
            equals: sanitizeID(user.id),
          },
        },
      ],
    },
  })) as unknown as { docs: { value: 'grid' | 'list' }[] }

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

          <FolderAndDocuments initialDisplayType={displayTypePref?.docs[0]?.value} />
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
