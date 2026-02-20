'use client'

import type { CollectionSlug, Document } from 'payload'
import type { FolderBreadcrumb, FolderOrDocument } from 'payload/shared'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { extractID } from 'payload/shared'
import React from 'react'

import { useAuth } from '../../../../providers/Auth/index.js'
import { FolderProvider, useFolder } from '../../../../providers/Folders/index.js'
import { useRouteCache } from '../../../../providers/RouteCache/index.js'
import { useServerFunctions } from '../../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { ConfirmationModal } from '../../../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { Drawer } from '../../../Drawer/index.js'
import { DrawerActionHeader } from '../../../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { ListCreateNewDocInFolderButton } from '../../../ListHeader/TitleActions/ListCreateNewDocInFolderButton.js'
import { LoadingOverlay } from '../../../Loading/index.js'
import { NoListResults } from '../../../NoListResults/index.js'
import { Translation } from '../../../Translation/index.js'
import { FolderBreadcrumbs } from '../../Breadcrumbs/index.js'
import { ColoredFolderIcon } from '../../ColoredFolderIcon/index.js'
import './index.scss'

const baseClass = 'move-folder-drawer'
const baseModalSlug = 'move-folder-drawer'
const confirmModalSlug = `${baseModalSlug}-confirm-move`

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
  readonly folderAssignedCollections: CollectionSlug[]
  readonly folderCollectionSlug: string
  readonly folderFieldName: string
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
  readonly populateMoveToFolderDrawer?: (folderID: null | number | string) => Promise<void> | void
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
  const { permissions } = useAuth()
  const [subfolders, setSubfolders] = React.useState<FolderOrDocument[]>([])
  const [documents, setDocuments] = React.useState<FolderOrDocument[]>([])
  const [breadcrumbs, setBreadcrumbs] = React.useState<FolderBreadcrumb[]>([])
  const [FolderResultsComponent, setFolderResultsComponent] = React.useState<React.ReactNode>(null)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [folderID, setFolderID] = React.useState<null | number | string>(props.fromFolderID || null)
  const hasLoadedRef = React.useRef(false)
  const { getFolderResultsComponentAndData } = useServerFunctions()

  const populateMoveToFolderDrawer = React.useCallback(
    async (folderIDToPopulate: null | number | string) => {
      try {
        const result = await getFolderResultsComponentAndData({
          browseByFolder: false,
          collectionsToDisplay: [props.folderCollectionSlug],
          displayAs: 'grid',
          // todo: should be able to pass undefined, empty array or null and get all folders. Need to look at API for this in the server function
          folderAssignedCollections: props.folderAssignedCollections,
          folderID: folderIDToPopulate,
          sort: 'name',
        })

        setBreadcrumbs(result.breadcrumbs || [])
        setSubfolders(result?.subfolders || [])
        setDocuments(result?.documents || [])
        setFolderResultsComponent(result.FolderResultsComponent || null)
        setFolderID(folderIDToPopulate)
        setHasLoaded(true)
      } catch (e) {
        setBreadcrumbs([])
        setSubfolders([])
        setDocuments([])
      }

      hasLoadedRef.current = true
    },
    [getFolderResultsComponentAndData, props.folderAssignedCollections, props.folderCollectionSlug],
  )

  React.useEffect(() => {
    if (!hasLoadedRef.current) {
      void populateMoveToFolderDrawer(props.fromFolderID)
    }
  }, [populateMoveToFolderDrawer, props.fromFolderID])

  if (!hasLoaded) {
    return <LoadingOverlay />
  }

  return (
    <FolderProvider
      allCollectionFolderSlugs={[props.folderCollectionSlug]}
      allowCreateCollectionSlugs={
        permissions.collections[props.folderCollectionSlug]?.create
          ? [props.folderCollectionSlug]
          : []
      }
      allowMultiSelection={false}
      breadcrumbs={breadcrumbs}
      documents={documents}
      folderFieldName={props.folderFieldName}
      folderID={folderID}
      FolderResultsComponent={FolderResultsComponent}
      key={folderID}
      onItemClick={async (item) => {
        await populateMoveToFolderDrawer(item.value.id)
      }}
      subfolders={subfolders}
    >
      <Content {...props} populateMoveToFolderDrawer={populateMoveToFolderDrawer} />
    </FolderProvider>
  )
}

function Content({
  drawerSlug,
  fromFolderID,
  fromFolderName,
  itemsToMove,
  onConfirm,
  populateMoveToFolderDrawer,
  skipConfirmModal,
  ...props
}: MoveToFolderDrawerProps) {
  const { clearRouteCache } = useRouteCache()
  const { closeModal, isModalOpen, openModal } = useModal()
  const [count] = React.useState(() => itemsToMove.length)
  const [folderAddedToUnderlyingFolder, setFolderAddedToUnderlyingFolder] = React.useState(false)
  const { i18n, t } = useTranslation()
  const {
    breadcrumbs,
    folderCollectionConfig,
    folderCollectionSlug,
    folderFieldName,
    folderID,
    FolderResultsComponent,
    folderType,
    getSelectedItems,
    subfolders,
  } = useFolder()
  const [FolderDocumentDrawer, , { closeDrawer: closeFolderDrawer, openDrawer: openFolderDrawer }] =
    useDocumentDrawer({
      collectionSlug: folderCollectionSlug,
    })

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
    async ({ collectionSlug, doc }: { collectionSlug: CollectionSlug; doc: Document }) => {
      await populateMoveToFolderDrawer(folderID)
      if (
        collectionSlug === folderCollectionSlug &&
        ((doc?.folder && fromFolderID === extractID(doc?.folder)) ||
          (!fromFolderID && !doc?.folder))
      ) {
        // if the folder we created is in the same folder as the one we are moving from
        // set variable so we can clear the route cache when we close the drawer
        setFolderAddedToUnderlyingFolder(true)
      }
    },
    [populateMoveToFolderDrawer, folderID, fromFolderID, folderCollectionSlug],
  )

  const onConfirmMove = React.useCallback(() => {
    if (typeof onConfirm === 'function') {
      void onConfirm(getSelectedFolder())
    }
  }, [getSelectedFolder, onConfirm])

  React.useEffect(() => {
    if (!isModalOpen(drawerSlug) && folderAddedToUnderlyingFolder) {
      // if we added a folder to the underlying folder, clear the route cache
      // so that the folder view will be reloaded with the new folder
      setFolderAddedToUnderlyingFolder(false)
      clearRouteCache()
    }
  }, [drawerSlug, isModalOpen, clearRouteCache, folderAddedToUnderlyingFolder])

  return (
    <div className={baseClass}>
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
            fromFolderName={fromFolderID ? fromFolderName : undefined}
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
                    void populateMoveToFolderDrawer(null)
                  }
                : undefined,
            },
            ...breadcrumbs.map((crumb, index) => ({
              id: crumb.id,
              name: crumb.name,
              onClick:
                index !== breadcrumbs.length - 1
                  ? () => {
                      void populateMoveToFolderDrawer(crumb.id)
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
              margin={false}
              onClick={() => {
                openFolderDrawer()
              }}
            >
              {t('fields:addLabel', {
                label: getTranslation(folderCollectionConfig.labels?.singular, i18n),
              })}
            </Button>
            <FolderDocumentDrawer
              initialData={{
                [folderFieldName]: folderID,
                folderType,
              }}
              onSave={(result) => {
                void onCreateSuccess({
                  collectionSlug: folderCollectionConfig.slug,
                  doc: result.doc,
                })
                closeFolderDrawer()
              }}
              redirectAfterCreate={false}
            />
          </>
        )}
      </div>

      <DrawerContentContainer className={`${baseClass}__body-section`}>
        {subfolders.length > 0 ? (
          FolderResultsComponent
        ) : (
          <NoListResults
            Actions={[
              <ListCreateNewDocInFolderButton
                buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                buttonSize="medium"
                buttonStyle="primary"
                collectionSlugs={[folderCollectionSlug]}
                folderAssignedCollections={props.folderAssignedCollections}
                key="create-folder"
                onCreateSuccess={onCreateSuccess}
                slugPrefix="create-new-folder-from-drawer--no-results"
              />,
            ]}
            Message={
              <>
                <h3>{i18n.t('general:noResultsFound')}</h3>
                <p>{i18n.t('general:noResultsDescription')}</p>
              </>
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
    </div>
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
