'use client'

import type {
  ClientCollectionConfig,
  FieldLabelClientProps,
  FilterOptionsResult,
  JsonObject,
  StaticDescription,
  StaticLabel,
  UploadFieldClient,
  UploadField as UploadFieldType,
  Where,
} from 'payload'
import type { MarkOptional } from 'ts-essentials'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo } from 'react'

import type { ListDrawerProps } from '../../elements/ListDrawer/types.js'
import type { PopulateDocs, ReloadDoc } from './types.js'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { Dropzone } from '../../elements/Dropzone/index.js'
import { useListDrawer } from '../../elements/ListDrawer/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { UploadComponentHasMany } from './HasMany/index.js'
import { UploadComponentHasOne } from './HasOne/index.js'
import './index.scss'

export const baseClass = 'upload'

type PopulatedDocs = { relationTo: string; value: JsonObject }[]

export type UploadInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly allowCreate?: boolean
  /**
   * Controls the visibility of the "Create new collection" button
   */
  readonly api?: string
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  readonly collection?: ClientCollectionConfig
  readonly customUploadActions?: React.ReactNode[]
  readonly Description?: React.ReactNode
  readonly description?: StaticDescription
  readonly Error?: React.ReactNode
  readonly filterOptions?: FilterOptionsResult
  readonly hasMany?: boolean
  readonly isSortable?: boolean
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly labelProps?: FieldLabelClientProps<MarkOptional<UploadFieldClient, 'type'>>
  readonly localized?: boolean
  readonly maxRows?: number
  readonly onChange?: (e) => void
  readonly path: string
  readonly readOnly?: boolean
  readonly relationTo: UploadFieldType['relationTo']
  readonly required?: boolean
  readonly serverURL?: string
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: (number | string)[] | (number | string)
}

export function UploadInput(props: UploadInputProps) {
  const {
    AfterInput,
    allowCreate,
    api,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    filterOptions: filterOptionsFromProps,
    hasMany,
    isSortable,
    Label,
    label,
    localized,
    maxRows,
    onChange: onChangeFromProps,
    path,
    readOnly,
    relationTo,
    required,
    serverURL,
    showError,
    style,
    value,
  } = props

  const [populatedDocs, setPopulatedDocs] = React.useState<
    {
      relationTo: string
      value: JsonObject
    }[]
  >()

  const [activeRelationTo, setActiveRelationTo] = React.useState<string>(
    Array.isArray(relationTo) ? relationTo[0] : relationTo,
  )

  const { openModal } = useModal()
  const { drawerSlug, setCollectionSlug, setInitialFiles, setMaxFiles, setOnSuccess } =
    useBulkUpload()
  const { permissions } = useAuth()
  const { code } = useLocale()
  const { i18n, t } = useTranslation()

  const filterOptions: FilterOptionsResult = useMemo(() => {
    return {
      ...filterOptionsFromProps,
      [activeRelationTo]: {
        ...((filterOptionsFromProps?.[activeRelationTo] as any) || {}),
        id: {
          ...((filterOptionsFromProps?.[activeRelationTo] as any)?.id || {}),
          not_in: ((filterOptionsFromProps?.[activeRelationTo] as any)?.id?.not_in || []).concat(
            ...(Array.isArray(value) || value ? [value] : []),
          ),
        },
      },
    }
  }, [value, activeRelationTo, filterOptionsFromProps])

  const [ListDrawer, , { closeDrawer: closeListDrawer, openDrawer: openListDrawer }] =
    useListDrawer({
      collectionSlugs: typeof relationTo === 'string' ? [relationTo] : relationTo,
      filterOptions,
    })

  const [
    CreateDocDrawer,
    ,
    { closeDrawer: closeCreateDocDrawer, openDrawer: openCreateDocDrawer },
  ] = useDocumentDrawer({
    collectionSlug: activeRelationTo,
  })

  /**
   * Prevent initial retrieval of documents from running more than once
   */
  const loadedValueDocsRef = React.useRef<boolean>(false)

  const canCreate = useMemo(() => {
    if (!allowCreate) {
      return false
    }

    if (typeof activeRelationTo === 'string') {
      if (permissions?.collections && permissions.collections?.[activeRelationTo]?.create) {
        return true
      }
    }

    return false
  }, [activeRelationTo, permissions, allowCreate])

  const onChange = React.useCallback(
    (newValue) => {
      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newValue)
      }
    },
    [onChangeFromProps],
  )

  const populateDocs = React.useCallback<PopulateDocs>(
    async (ids, relatedCollectionSlug) => {
      const query: {
        [key: string]: unknown
        where: Where
      } = {
        depth: 0,
        draft: true,
        limit: ids.length,
        locale: code,
        where: {
          and: [
            {
              id: {
                in: ids,
              },
            },
          ],
        },
      }

      const response = await fetch(`${serverURL}${api}/${relatedCollectionSlug}`, {
        body: qs.stringify(query),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-HTTP-Method-Override': 'GET',
        },
        method: 'POST',
      })
      if (response.ok) {
        const json = await response.json()
        const sortedDocs = ids.map((id) =>
          json.docs.find((doc) => {
            return String(doc.id) === String(id)
          }),
        )

        return { ...json, docs: sortedDocs }
      }

      return null
    },
    [code, serverURL, api, i18n.language],
  )

  const onUploadSuccess = useCallback(
    (newDocs: JsonObject[]) => {
      if (hasMany) {
        const mergedValue = [
          ...(Array.isArray(value) ? value : []),
          ...newDocs.map((doc) => doc.id),
        ]
        onChange(mergedValue)
        setPopulatedDocs((currentDocs) => [
          ...(currentDocs || []),
          ...newDocs.map((doc) => ({
            relationTo: activeRelationTo,
            value: doc,
          })),
        ])
      } else {
        const firstDoc = newDocs[0]
        onChange(firstDoc.id)
        setPopulatedDocs([
          {
            relationTo: activeRelationTo,
            value: firstDoc,
          },
        ])
      }
    },
    [value, onChange, activeRelationTo, hasMany],
  )

  const onLocalFileSelection = React.useCallback(
    (fileList?: FileList) => {
      let fileListToUse = fileList
      if (!hasMany && fileList && fileList.length > 1) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(fileList[0])
        fileListToUse = dataTransfer.files
      }
      if (fileListToUse) {
        setInitialFiles(fileListToUse)
      }
      setCollectionSlug(relationTo)
      setOnSuccess(onUploadSuccess)
      if (typeof maxRows === 'number') {
        setMaxFiles(maxRows)
      }
      openModal(drawerSlug)
    },
    [
      drawerSlug,
      hasMany,
      onUploadSuccess,
      openModal,
      relationTo,
      setCollectionSlug,
      setInitialFiles,
      setOnSuccess,
      maxRows,
      setMaxFiles,
    ],
  )

  // only hasMany can bulk select
  const onListBulkSelect = React.useCallback<NonNullable<ListDrawerProps['onBulkSelect']>>(
    async (docs) => {
      const selectedDocIDs = []

      for (const [id, isSelected] of docs) {
        if (isSelected) {
          selectedDocIDs.push(id)
        }
      }

      const loadedDocs = await populateDocs(selectedDocIDs, activeRelationTo)
      if (loadedDocs) {
        setPopulatedDocs((currentDocs) => [
          ...(currentDocs || []),
          ...loadedDocs.docs.map((doc) => ({
            relationTo: activeRelationTo,
            value: doc,
          })),
        ])
      }
      onChange([...(Array.isArray(value) ? value : []), ...selectedDocIDs])
      closeListDrawer()
    },
    [activeRelationTo, closeListDrawer, onChange, populateDocs, value],
  )

  const onDocCreate = React.useCallback(
    (data) => {
      if (data.doc) {
        setPopulatedDocs((currentDocs) => [
          ...(currentDocs || []),
          {
            relationTo: activeRelationTo,
            value: data.doc,
          },
        ])

        onChange(data.doc.id)
      }
      closeCreateDocDrawer()
    },
    [closeCreateDocDrawer, activeRelationTo, onChange],
  )

  const onListSelect = React.useCallback<NonNullable<ListDrawerProps['onSelect']>>(
    async ({ collectionSlug, docID }) => {
      const loadedDocs = await populateDocs([docID], collectionSlug)
      const selectedDoc = loadedDocs ? loadedDocs.docs?.[0] : null
      setPopulatedDocs((currentDocs) => {
        if (selectedDoc) {
          if (hasMany) {
            return [
              ...(currentDocs || []),
              {
                relationTo: activeRelationTo,
                value: selectedDoc,
              },
            ]
          }
          return [
            {
              relationTo: activeRelationTo,
              value: selectedDoc,
            },
          ]
        }
        return currentDocs
      })
      if (hasMany) {
        onChange([...(Array.isArray(value) ? value : []), docID])
      } else {
        onChange(docID)
      }
      closeListDrawer()
    },
    [closeListDrawer, hasMany, populateDocs, onChange, value, activeRelationTo],
  )

  const reloadDoc = React.useCallback<ReloadDoc>(
    async (docID, collectionSlug) => {
      const { docs } = await populateDocs([docID], collectionSlug)

      if (docs[0]) {
        setPopulatedDocs((currentDocs) => {
          const existingDocIndex = currentDocs?.findIndex((doc) => {
            return doc.value.id === docs[0].id && doc.relationTo === collectionSlug
          })
          if (existingDocIndex > -1) {
            const updatedDocs = [...currentDocs]
            updatedDocs[existingDocIndex] = {
              relationTo: collectionSlug,
              value: docs[0],
            }
            return updatedDocs
          }
        })
      }
    },
    [populateDocs],
  )

  // only hasMany can reorder
  const onReorder = React.useCallback(
    (newValue) => {
      const newValueIDs = newValue.map(({ value }) => value.id)
      onChange(newValueIDs)
      setPopulatedDocs(newValue)
    },
    [onChange],
  )

  const onRemove = React.useCallback(
    (newValue?: PopulatedDocs) => {
      const newValueIDs = newValue ? newValue.map(({ value }) => value.id) : null
      onChange(hasMany ? newValueIDs : newValueIDs ? newValueIDs[0] : null)
      setPopulatedDocs(newValue ? newValue : [])
    },
    [onChange, hasMany],
  )

  useEffect(() => {
    async function loadInitialDocs() {
      if (value) {
        loadedValueDocsRef.current = true
        const loadedDocs = await populateDocs(
          Array.isArray(value) ? value : [value],
          activeRelationTo,
        )
        if (loadedDocs) {
          setPopulatedDocs(
            loadedDocs.docs.map((doc) => ({ relationTo: activeRelationTo, value: doc })),
          )
        }
      }
    }

    if (!loadedValueDocsRef.current) {
      void loadInitialDocs()
    }
  }, [populateDocs, activeRelationTo, value])

  const showDropzone =
    !value ||
    (hasMany && Array.isArray(value) && (typeof maxRows !== 'number' || value.length < maxRows)) ||
    (!hasMany && populatedDocs?.[0] && typeof populatedDocs[0].value === 'undefined')

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
      style={style}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${baseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
      </div>
      {BeforeInput}
      <div className={`${baseClass}__dropzoneAndUpload`}>
        {hasMany && Array.isArray(value) && value.length > 0 ? (
          <>
            {populatedDocs && populatedDocs?.length > 0 ? (
              <UploadComponentHasMany
                fileDocs={populatedDocs}
                isSortable={isSortable && !readOnly}
                onRemove={onRemove}
                onReorder={onReorder}
                readonly={readOnly}
                reloadDoc={reloadDoc}
                serverURL={serverURL}
              />
            ) : (
              <div className={`${baseClass}__loadingRows`}>
                {value.map((id) => (
                  <ShimmerEffect height="40px" key={id} />
                ))}
              </div>
            )}
          </>
        ) : null}
        {!hasMany && value ? (
          <>
            {populatedDocs && populatedDocs?.length > 0 && populatedDocs[0].value ? (
              <UploadComponentHasOne
                fileDoc={populatedDocs[0]}
                onRemove={onRemove}
                readonly={readOnly}
                reloadDoc={reloadDoc}
                serverURL={serverURL}
              />
            ) : populatedDocs && value && !populatedDocs?.[0]?.value ? (
              <>
                {t('general:untitled')} - ID: {value}
              </>
            ) : (
              <ShimmerEffect height="62px" />
            )}
          </>
        ) : null}
        {showDropzone ? (
          <Dropzone
            disabled={readOnly || !canCreate}
            multipleFiles={hasMany}
            onChange={onLocalFileSelection}
          >
            <div className={`${baseClass}__dropzoneContent`}>
              <div className={`${baseClass}__dropzoneContent__buttons`}>
                {canCreate && (
                  <>
                    <Button
                      buttonStyle="pill"
                      className={`${baseClass}__createNewToggler`}
                      disabled={readOnly || !canCreate}
                      onClick={() => {
                        if (!readOnly) {
                          if (hasMany) {
                            onLocalFileSelection()
                          } else {
                            openCreateDocDrawer()
                          }
                        }
                      }}
                      size="small"
                    >
                      {t('general:createNew')}
                    </Button>
                    <span className={`${baseClass}__dropzoneContent__orText`}>
                      {t('general:or')}
                    </span>
                  </>
                )}
                <Button
                  buttonStyle="pill"
                  className={`${baseClass}__listToggler`}
                  disabled={readOnly}
                  onClick={openListDrawer}
                  size="small"
                >
                  {t('fields:chooseFromExisting')}
                </Button>
                <CreateDocDrawer onSave={onDocCreate} />
                <ListDrawer
                  allowCreate={canCreate}
                  enableRowSelections={hasMany}
                  onBulkSelect={onListBulkSelect}
                  onSelect={onListSelect}
                />
              </div>

              {canCreate && !readOnly && (
                <p className={`${baseClass}__dragAndDropText`}>
                  {t('general:or')} {t('upload:dragAndDrop')}
                </p>
              )}
            </div>
          </Dropzone>
        ) : (
          <>
            {!readOnly &&
            !populatedDocs &&
            (!value ||
              typeof maxRows !== 'number' ||
              (Array.isArray(value) && value.length < maxRows)) ? (
              <ShimmerEffect height="40px" />
            ) : null}
          </>
        )}
      </div>
      {AfterInput}
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}
