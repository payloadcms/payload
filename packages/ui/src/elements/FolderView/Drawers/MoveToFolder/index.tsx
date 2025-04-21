'use client'

import type { CollectionSlug } from 'payload'
import type {
  FolderBreadcrumb,
  FolderDocumentItemKey,
  FolderOrDocument,
  GetFolderDataResult,
} from 'payload/shared'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useConfig } from '../../../../providers/Config/index.js'
import { FolderProvider, useFolder } from '../../../../providers/Folders/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { ConfirmationModal } from '../../../ConfirmationModal/index.js'
import { Drawer } from '../../../Drawer/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { ListCreateNewDocInFolderButton } from '../../../ListHeader/TitleActions/ListCreateNewDocInFolderButton.js'
import { LoadingOverlay } from '../../../Loading/index.js'
import { NoListResults } from '../../../NoListResults/index.js'
import { Translation } from '../../../Translation/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { ColoredFolderIcon } from '../../ColoredFolderIcon/index.js'
import { ItemCardGrid } from '../../ItemCardGrid/index.js'
import { NewFolderDrawer } from '../NewFolder/index.js'
import './index.scss'

const baseClass = 'move-folder-drawer'
const baseModalSlug = 'move-folder-drawer'
const confirmModalSlug = `${baseModalSlug}-confirm-move`
const newFolderDrawerSlug = `${baseModalSlug}-new-folder`
type Props = {
  readonly drawerSlug: string
  readonly folderID: number | string
  readonly itemsToMove: FolderOrDocument[]
  readonly onConfirm: (folderID: number | string) => Promise<void> | void
}
export function MoveItemsToFolderDrawer(props: Props) {
  return (
    <Drawer gutter={false} Header={null} slug={props.drawerSlug}>
      <LoadFolderData {...props} />
    </Drawer>
  )
}

function LoadFolderData(props: Props) {
  const {
    config: {
      folders: { slug: folderCollectionSlug },
      routes,
      serverURL,
    },
  } = useConfig()
  const [subfolders, setSubfolders] = React.useState<FolderOrDocument[]>([])
  const [documents, setDocuments] = React.useState<FolderOrDocument[]>([])
  const [breadcrumbs, setBreadcrumbs] = React.useState<FolderBreadcrumb[]>([])
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    const onLoad = async () => {
      // call some endpoint to load the data

      try {
        const folderDataReq = await fetch(
          `${serverURL}${routes.api}/${folderCollectionSlug}/populate-folder-data${props.folderID ? `?folderID=${props.folderID}` : ''}`,
          {
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
          },
        )

        if (folderDataReq.status === 200) {
          const folderDataRes: GetFolderDataResult = await folderDataReq.json()
          setBreadcrumbs(folderDataRes?.breadcrumbs || [])
          setSubfolders(folderDataRes?.subfolders || [])
          setDocuments(folderDataRes?.documents || [])
        } else {
          setBreadcrumbs([])
          setSubfolders([])
          setDocuments([])
        }
      } catch (e) {
        console.error(e)
      }

      setHasLoaded(true)
    }

    if (!hasLoaded) {
      void onLoad()
    }
  }, [folderCollectionSlug, routes.api, serverURL, hasLoaded, props.folderID])

  if (!hasLoaded) {
    return <LoadingOverlay />
  }

  return (
    <FolderProvider
      allowMultiSelection={false}
      breadcrumbs={breadcrumbs}
      documents={documents}
      folderID={props.folderID}
      subfolders={subfolders}
    >
      <Content {...props} />
    </FolderProvider>
  )
}

function Content({ drawerSlug, itemsToMove, onConfirm }: Props) {
  const { closeModal, openModal } = useModal()
  const [count] = React.useState(() => itemsToMove.length)
  const { i18n, t } = useTranslation()
  const {
    addItems,
    breadcrumbs,
    folderCollectionConfig,
    folderCollectionSlug,
    getSelectedItems,
    setFolderID,
    subfolders,
  } = useFolder()

  const getSelectedFolder = React.useCallback(
    ({ key }: { key: 'id' | 'name' }) => {
      const selected = getSelectedItems()

      if (selected.length === 0) {
        const lastCrumb = breadcrumbs?.[breadcrumbs.length - 1]
        // use the breadcrumb
        if (key === 'id') {
          return lastCrumb?.id || null
        } else {
          return lastCrumb?.name || 'Root'
        }
      } else {
        // use the selected item
        if (key === 'id') {
          return selected[0].value.id
        } else {
          return selected[0].value._folderOrDocumentTitle
        }
      }
    },
    [breadcrumbs, getSelectedItems],
  )

  const onCreateSuccess = React.useCallback(
    ({ collectionSlug, doc }: { collectionSlug: CollectionSlug; doc: Record<string, any> }) => {
      const itemValue: FolderOrDocument['value'] = {
        id: doc?.id,
        _folderOrDocumentTitle: doc?.[folderCollectionConfig.admin.useAsTitle ?? 'id'],
        _parentFolder: doc?._parentFolder,
        createdAt: doc?.createdAt,
        updatedAt: doc?.updatedAt,
      }

      void addItems([
        {
          itemKey: `${collectionSlug}-${doc.id}`,
          relationTo: collectionSlug,
          value: itemValue,
        },
      ])
    },
    [addItems, folderCollectionConfig.admin.useAsTitle],
  )

  return (
    <>
      <DrawerActionHeader
        onCancel={() => {
          closeModal(drawerSlug)
        }}
        onSave={() => {
          openModal(confirmModalSlug)
        }}
        saveLabel={t('folder:selectFolder')}
        title={t('general:movingCount', {
          count,
          label: count > 1 ? t('general:items') : t('general:item'),
        })}
      />

      <div className={`${baseClass}__breadcrumbs-section`}>
        <FolderBreadcrumbs
          breadcrumbs={[
            {
              id: null,
              name: <ColoredFolderIcon />,
              onClick: breadcrumbs.length
                ? () => {
                    void setFolderID({ folderID: null })
                  }
                : undefined,
            },
            ...breadcrumbs.map((crumb, index) => ({
              id: crumb.id,
              name: crumb.name,
              onClick:
                index !== count - 1
                  ? () => {
                      void setFolderID({ folderID: crumb.id })
                    }
                  : undefined,
            })),
          ]}
        />
        {subfolders.length > 0 && (
          <>
            <Button
              buttonStyle="pill"
              className={`${baseClass}__add-folder-button`}
              onClick={() => {
                openModal(newFolderDrawerSlug)
              }}
            >
              {t('fields:addLabel', {
                label: getTranslation(folderCollectionConfig.labels?.singular, i18n),
              })}
            </Button>
            <NewFolderDrawer
              drawerSlug={newFolderDrawerSlug}
              onNewFolderSuccess={(doc) => {
                closeModal(newFolderDrawerSlug)
                if (typeof onCreateSuccess === 'function') {
                  void onCreateSuccess({
                    collectionSlug: folderCollectionConfig.slug,
                    doc,
                  })
                }
              }}
            />
          </>
        )}
      </div>

      <DrawerContentContainer className={`${baseClass}__body-section`}>
        {subfolders.length > 0 ? (
          <ItemCardGrid
            disabledItemKeys={new Set(itemsToMove.map(({ itemKey }) => itemKey))}
            items={subfolders}
            selectedItemKeys={
              new Set<FolderDocumentItemKey>([
                `${folderCollectionSlug}-${getSelectedFolder({ key: 'id' })}`,
              ])
            }
            type="folder"
          />
        ) : (
          <NoListResults
            Actions={[
              <ListCreateNewDocInFolderButton
                buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                collectionSlugs={[folderCollectionSlug]}
                key="create-folder"
                onCreateSuccess={onCreateSuccess}
              />,
            ]}
            Message={
              <p>
                {i18n.t('general:noResults', {
                  label: `${getTranslation(folderCollectionConfig.labels?.plural, i18n)}`,
                })}
              </p>
            }
          />
        )}
      </DrawerContentContainer>

      <ConfirmationModal
        body={
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:moveConfirm"
            t={t}
            variables={{
              count,
              destination: getSelectedFolder({ key: 'name' }) || 'Root',
              label: count > 1 ? t('general:items') : t('general:item'),
            }}
          />
        }
        confirmingLabel={t('general:moving')}
        heading={t('general:moveCount', {
          count,
          label: count > 1 ? t('general:items') : t('general:item'),
        })}
        modalSlug={confirmModalSlug}
        onConfirm={async () => {
          await onConfirm(getSelectedFolder({ key: 'id' }))
        }}
      />
    </>
  )
}
