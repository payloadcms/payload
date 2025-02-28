import type {
  ClientUser,
  PaginatedDocs,
  SanitizedPermissions,
  ServerProps,
  VisibleEntities,
} from 'payload'

import { FolderAndDocuments, FolderProvider, ListQueryProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { type groupNavItems, sanitizeID } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData, type GetFolderDataResult, isNumber } from 'payload/shared'

import './index.scss'

import React from 'react'

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
    i18n,
    locale,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
        routes,
      },
    },
    payload,
    permissions,
    searchParams,
    user,
  } = props

  const searchParamFolderID = searchParams?.folder as string

  const docLimit = isNumber(searchParams?.limit) ? parseInt(String(searchParams.limit), 10) : 10

  const { breadcrumbs, hasMoreDocuments, items } = await getFolderData({
    docLimit,
    folderID: searchParamFolderID,
    page: isNumber(searchParams?.page) ? parseInt(String(searchParams.page), 10) : 1,
    payload,
    search: typeof searchParams?.search === 'string' ? searchParams.search : undefined,
  })

  const folderID = breadcrumbs[breadcrumbs.length - 1]?.id

  if (folderID && searchParamFolderID && searchParamFolderID !== String(folderID)) {
    return redirect(`${routes.admin}`)
  }

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
    <ListQueryProvider data={undefined} defaultLimit={docLimit} modifySearchParams>
      <FolderProvider
        initialData={{
          breadcrumbs,
          folderID,
          hasMoreDocuments,
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
    </ListQueryProvider>
  )
}
