'use client'

import type { CollectionSlug, Document } from 'payload'
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

type ActionProps =
  | {
      readonly action: 'moveItemsToFolder'
    }
  | {
      readonly action: 'moveItemToFolder'
      readonly title: string
    }
export type MoveToFolderDrawerProps = {
  readonly drawerSlug: string
  readonly fromFolderID?: number | string
  readonly fromFolderName?: string
  readonly itemsToMove: FolderOrDocument[]
  /**
   * Callback function to be called when the user confirms the move
   *
   * @param folderID - The ID of the folder to move the items to
   */
  readonly onConfirm: (args: {
    id: null | number | string
    name: null | string
  }) => Promise<void> | void
  /**
   * Set to `true` to skip the confirmation modal
   * @default false
   */
  readonly skipConfirmModal?: boolean
} & ActionProps

export function MoveItemsToFolderDrawer(props: MoveToFolderDrawerProps) {
  return (
    <Drawer gutter={false} Header={null} slug={props.drawerSlug}>
      <LoadFolderData {...props} />
    </Drawer>
  )
}

function LoadFolderData(props: MoveToFolderDrawerProps) {
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
          `${serverURL}${routes.api}/${folderCollectionSlug}/populate-folder-data${props.fromFolderID ? `?folderID=${props.fromFolderID}` : ''}`,
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
        // eslint-disable-next-line no-console
        console.error(e)
      }

      setHasLoaded(true)
    }

    if (!hasLoaded) {
      void onLoad()
    }
  }, [folderCollectionSlug, routes.api, serverURL, hasLoaded, props.fromFolderID])

  if (!hasLoaded) {
    return <LoadingOverlay />
  }

  return (
    <FolderProvider
      allowMultiSelection={false}
      breadcrumbs={breadcrumbs}
      documents={documents}
      folderCollectionSlugs={[]}
      folderID={props.fromFolderID}
      subfolders={subfolders}
    >
      <Content {...props} />
    </FolderProvider>
  )
}

function Content({
  drawerSlug,
  fromFolderName,
  itemsToMove,
  onConfirm,
  skipConfirmModal,
  ...props
}: MoveToFolderDrawerProps) {
  const { closeModal, openModal } = useModal()
  const [count] = React.useState(() => itemsToMove.length)
  const { i18n, t } = useTranslation()
  const {
    addItems,
    breadcrumbs,
    folderCollectionConfig,
    folderCollectionSlug,
    folderFieldName,
    getSelectedItems,
    setFolderID,
    subfolders,
  } = useFolder()

  const getSelectedFolder = React.useCallback((): {
    id: null | number | string
    name: null | string
  } => {
    const selected = getSelectedItems()

    if (selected.length === 0) {
      const lastCrumb = breadcrumbs?.[breadcrumbs.length - 1]
      // use the breadcrumb
      return {
        id: lastCrumb?.id || null,
        name: lastCrumb?.name || null,
      }
    } else {
      // use the selected item
      return {
        id: selected[0].value.id,
        name: selected[0].value._folderOrDocumentTitle,
      }
    }
  }, [breadcrumbs, getSelectedItems])

  const onCreateSuccess = React.useCallback(
    ({ collectionSlug, doc }: { collectionSlug: CollectionSlug; doc: Document }) => {
      const itemValue: FolderOrDocument['value'] = {
        id: doc?.id,
        _folderOrDocumentTitle: doc?.[folderCollectionConfig.admin.useAsTitle ?? 'id'],
        createdAt: doc?.createdAt,
        folderID: doc?.[folderFieldName],
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

  const onConfirmMove = React.useCallback(() => {
    if (typeof onConfirm === 'function') {
      void onConfirm(getSelectedFolder())
    }
  }, [getSelectedFolder, onConfirm])

  return (
    <>
      <DrawerActionHeader
        onCancel={() => {
          closeModal(drawerSlug)
        }}
        onSave={() => {
          if (skipConfirmModal) {
            onConfirmMove()
          } else {
            openModal(confirmModalSlug)
          }
        }}
        saveLabel={t('general:select')}
        title={
          <DrawerHeading
            action={props.action}
            count={count}
            fromFolderName={props.fromFolderID ? fromFolderName : undefined}
            title={props.action === 'moveItemToFolder' ? props.title : undefined}
          />
        }
      />

      <div className={`${baseClass}__breadcrumbs-section`}>
        <FolderBreadcrumbs
          breadcrumbs={[
            {
              id: null,
              name: (
                <span className={`${baseClass}__folder-breadcrumbs-root`}>
                  <ColoredFolderIcon />
                  {t('folder:folders')}
                </span>
              ),
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
                index !== breadcrumbs.length - 1
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
              new Set<FolderDocumentItemKey>([`${folderCollectionSlug}-${getSelectedFolder().id}`])
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
                slugPrefix="create-new-folder-from-drawer--no-results"
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

      {!skipConfirmModal && (
        <ConfirmationModal
          body={
            <ConfirmationMessage
              action={props.action}
              count={count}
              fromFolderName={fromFolderName}
              title={props.action === 'moveItemToFolder' ? props.title : undefined}
              toFolderName={getSelectedFolder().name}
            />
          }
          confirmingLabel={t('general:moving')}
          confirmLabel={t('general:move')}
          heading={t('general:confirmMove')}
          modalSlug={confirmModalSlug}
          onConfirm={onConfirmMove}
        />
      )}
    </>
  )
}

function DrawerHeading(
  props: { count?: number } & ActionProps & Pick<MoveToFolderDrawerProps, 'fromFolderName'>,
): string {
  const { t } = useTranslation()

  switch (props.action) {
    case 'moveItemToFolder':
      // moving current folder from list view actions menu
      // or moving item from edit view
      if (props.fromFolderName) {
        // move from folder
        return t('folder:movingFromFolder', {
          fromFolder: props.fromFolderName,
          title: props.title,
        })
      } else {
        // move from root
        return t('folder:selectFolderForItem', {
          title: props.title,
        })
      }

    case 'moveItemsToFolder':
      if (props.fromFolderName) {
        // move from folder
        return t('folder:movingFromFolder', {
          fromFolder: props.fromFolderName,
          title: `${props.count} ${props.count > 1 ? t('general:items') : t('general:item')}`,
        })
      } else {
        // move from root
        return t('folder:selectFolderForItem', {
          title: `${props.count} ${props.count > 1 ? t('general:items') : t('general:item')}`,
        })
      }
  }
}

function ConfirmationMessage(
  props: { count?: number; toFolderName?: string } & ActionProps &
    Pick<MoveToFolderDrawerProps, 'fromFolderName'>,
) {
  const { t } = useTranslation()

  switch (props.action) {
    case 'moveItemToFolder':
      // moving current folder from list view actions menu
      // or moving item from edit view
      if (props.toFolderName) {
        // move to destination
        // You are about to move {{title}} to {{toFolder}}. Are you sure?
        return (
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
              2: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="folder:moveItemToFolderConfirmation"
            t={t}
            variables={{
              title: props.title,
              toFolder: props.toFolderName,
            }}
          />
        )
      } else {
        // move to root
        // You are about to move {{title}} to the root folder. Are you sure?
        return (
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="folder:moveItemToRootConfirmation"
            t={t}
            variables={{
              title: props.title,
            }}
          />
        )
      }

    case 'moveItemsToFolder':
      // moving many (documents/folders) from list view
      if (props.toFolderName) {
        // move to destination
        // You are about to move {{count}} {{label}} to {{toFolder}}. Are you sure?
        return (
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
              2: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="folder:moveItemsToFolderConfirmation"
            t={t}
            variables={{
              count: props.count,
              label: props.count > 1 ? t('general:items') : t('general:item'),
              toFolder: props.toFolderName,
            }}
          />
        )
      } else {
        // move to root
        // You are about to move {{count}} {{label}} to the root folder. Are you sure?
        return (
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="folder:moveItemsToRootConfirmation"
            t={t}
            variables={{
              count: props.count,
              label: props.count > 1 ? t('general:items') : t('general:item'),
            }}
          />
        )
      }
  }
}
