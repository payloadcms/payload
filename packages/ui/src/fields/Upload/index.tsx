'use client'

import type {
  FilterOptionsResult,
  JsonObject,
  PaginatedDocs,
  UploadFieldProps,
  Where,
} from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo } from 'react'

import type { ListDrawerProps } from '../../elements/ListDrawer/types.js'
import type { UploadInputProps } from './HasOne/Input.js'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { DropzoneShell } from '../../elements/DropzoneShell/index.js'
import { useListDrawer } from '../../elements/ListDrawer/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { UploadComponentHasMany } from './HasMany/index.js'
import { UploadInputHasOne } from './HasOne/Input.js'
import { UploadComponentHasOne2 } from './HasOne/index.js'
import './index.scss'

export { UploadFieldProps, UploadInputHasOne as UploadInput }
export type { UploadInputProps }

export const baseClass = 'upload'

type PopulatedDocs = { relationTo: string; value: JsonObject }[]

export function UploadComponent(props: UploadFieldProps) {
  const {
    field: { _path, hasMany, maxRows, relationTo, required },
    field,
    readOnly,
    validate,
  } = props

  const memoizedValidate = React.useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const [populatedDocs, setPopulatedDocs] = React.useState<
    {
      relationTo: string
      value: JsonObject
    }[]
  >(null)
  const [activeRelationTo, setActiveRelationTo] = React.useState<string>(
    Array.isArray(relationTo) ? relationTo[0] : relationTo,
  )

  const { openModal } = useModal()
  const { drawerSlug, setCollectionSlug, setInitialFiles, setMaxFiles, setOnSuccess } =
    useBulkUpload()
  const { permissions } = useAuth()
  const { config } = useConfig()
  const { code } = useLocale()
  const { i18n, t } = useTranslation()
  const {
    filterOptions: filterOptionsFromProps,
    setValue,
    value,
  } = useField<string | string[]>({
    path: _path,
    validate: memoizedValidate,
  })

  const filterOptions: FilterOptionsResult = useMemo(() => {
    return {
      ...filterOptionsFromProps,
      [activeRelationTo]: {
        ...((filterOptionsFromProps?.[activeRelationTo] as any) || {}),
        id: {
          ...((filterOptionsFromProps?.[activeRelationTo] as any)?.id || {}),
          not_in: ((filterOptionsFromProps?.[activeRelationTo] as any)?.id?.not_in || []).concat(
            ...((Array.isArray(value) || value ? [value] : []) || []),
          ),
        },
      },
    }
  }, [value, activeRelationTo, filterOptionsFromProps])

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs: typeof relationTo === 'string' ? [relationTo] : relationTo,
    filterOptions,
  })

  const inputRef = React.useRef<HTMLInputElement>(null)
  const loadedValueDocsRef = React.useRef<boolean>(false)

  const canCreate = useMemo(() => {
    if (typeof activeRelationTo === 'string') {
      if (permissions?.collections && permissions.collections?.[activeRelationTo]?.create) {
        if (permissions.collections[activeRelationTo].create?.permission === true) {
          return true
        }
      }
    }

    return false
  }, [activeRelationTo, permissions])

  const populateDocs = React.useCallback(
    async (ids: (number | string)[], relatedCollectionSlug: string): Promise<PaginatedDocs> => {
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

      const response = await fetch(
        `${config.serverURL}${config.routes.api}/${relatedCollectionSlug}`,
        {
          body: qs.stringify(query),
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-HTTP-Method-Override': 'GET',
          },
          method: 'POST',
        },
      )
      if (response.ok) {
        const json = await response.json()
        const sortedDocs = ids.map((id) => json.docs.find((doc) => doc.id === id))
        return { ...json, docs: sortedDocs }
      }
    },
    [code, config.routes.api, config.serverURL, i18n.language],
  )

  const onUploadSuccess = useCallback(
    (newDocs: JsonObject[]) => {
      if (hasMany) {
        const mergedValue = [
          ...(Array.isArray(value) ? value : []),
          ...newDocs.map((doc) => doc.id),
        ]
        setValue(mergedValue)
        setPopulatedDocs((currentDocs) => [
          ...(currentDocs || []),
          ...newDocs.map((doc) => ({
            relationTo: activeRelationTo,
            value: doc,
          })),
        ])
      } else {
        const firstDoc = newDocs[0]
        setValue(firstDoc.id)
        setPopulatedDocs([
          {
            relationTo: activeRelationTo,
            value: firstDoc,
          },
        ])
      }
    },
    [value, hasMany, setValue, activeRelationTo],
  )

  const onFileSelection = React.useCallback(
    (fileList?: FileList) => {
      let fileListToUse = fileList
      if (!hasMany && fileList.length > 1) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(fileList[0])
        fileListToUse = dataTransfer.files
      }
      setInitialFiles(fileListToUse)
      setCollectionSlug(relationTo)
      setOnSuccess(onUploadSuccess)
      if (typeof maxRows === 'number') setMaxFiles(maxRows)
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
  const onListBulkSelect = React.useCallback<ListDrawerProps['onBulkSelect']>(
    async (docs) => {
      const selectedDocIDs = Object.entries(docs).reduce((acc, [docID, isSelected]) => {
        if (isSelected) {
          acc.push(docID)
        }
        return acc
      }, [])
      const loadedDocs = await populateDocs(selectedDocIDs, activeRelationTo)
      setPopulatedDocs((currentDocs) => [
        ...(currentDocs || []),
        ...loadedDocs.docs.map((doc) => ({
          relationTo: activeRelationTo,
          value: doc,
        })),
      ])
      setValue([...(value || []), ...selectedDocIDs])
      closeListDrawer()
    },
    [activeRelationTo, closeListDrawer, populateDocs, setValue, value],
  )

  const onListSelect = React.useCallback<ListDrawerProps['onSelect']>(
    async ({ collectionSlug, docID }) => {
      const loadedDocs = await populateDocs([docID], collectionSlug)
      const selectedDoc = loadedDocs.docs?.[0]
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
      if (Array.isArray(value) || hasMany) {
        setValue([...(value || []), docID])
      } else {
        setValue(docID)
      }
      closeListDrawer()
    },
    [closeListDrawer, hasMany, populateDocs, setValue, value, activeRelationTo],
  )

  // only hasMany can reorder
  const onReorder = React.useCallback(
    (newValue) => {
      const newValueIDs = newValue.map(({ value }) => value.id)
      setValue(newValueIDs)
      setPopulatedDocs(newValue)
    },
    [setValue],
  )

  const onRemove = React.useCallback(
    (newValue?: PopulatedDocs) => {
      const newValueIDs = newValue ? newValue.map(({ value }) => value.id) : null
      setValue(hasMany ? newValueIDs : newValueIDs ? newValueIDs[0] : null)
      setPopulatedDocs(newValue)
    },
    [setValue, hasMany],
  )

  useEffect(() => {
    async function loadInitialDocs() {
      const loadedDocs = await populateDocs(
        Array.isArray(value) ? value : [value],
        activeRelationTo,
      )
      setPopulatedDocs(loadedDocs.docs.map((doc) => ({ relationTo: activeRelationTo, value: doc })))
      loadedValueDocsRef.current = true
    }

    if (value && !loadedValueDocsRef.current) {
      void loadInitialDocs()
    }
  }, [populateDocs, activeRelationTo, value])

  const showDropzone =
    !value ||
    (value && (!populatedDocs || populatedDocs.length === 0)) ||
    (hasMany && Array.isArray(value) && (typeof maxRows !== 'number' || value.length < maxRows))

  return (
    <div className={[fieldBaseClass, 'upload'].filter(Boolean).join(' ')}>
      <FieldLabel
        Label={field?.admin?.components?.Label}
        field={field}
        label={field.label}
        required={required}
      />

      <div className={`${baseClass}__dropzoneAndUpload`}>
        {hasMany && value && value.length > 0 && populatedDocs?.length > 0 ? (
          <UploadComponentHasMany
            fileDocs={populatedDocs}
            isSortable
            onRemove={onRemove}
            onReorder={onReorder}
          />
        ) : null}

        {!hasMany && value && populatedDocs?.length > 0 ? (
          <UploadComponentHasOne2 fileDoc={populatedDocs[0]} onRemove={onRemove} />
        ) : null}

        {showDropzone ? (
          <DropzoneShell multipleFiles={hasMany} onChange={onFileSelection}>
            <div className={`${baseClass}__dropzoneContent`}>
              <div className={`${baseClass}__dropzoneContent__buttons`}>
                <Button
                  buttonStyle="icon-label"
                  disabled={readOnly || !canCreate}
                  icon="plus"
                  iconPosition="left"
                  onClick={() => {
                    if (hasMany) {
                      onFileSelection()
                    } else {
                      inputRef.current.click()
                    }
                  }}
                  size="small"
                >
                  {t('general:createNew')}
                </Button>
                <input
                  aria-hidden="true"
                  className={`${baseClass}__hidden-input`}
                  disabled={readOnly}
                  hidden
                  multiple={hasMany}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onFileSelection(e.target.files)
                    }
                  }}
                  ref={inputRef}
                  type="file"
                />
                <ListDrawerToggler className={`${baseClass}__toggler`} disabled={readOnly}>
                  <Button buttonStyle="icon-label" el="span" icon="plus" iconPosition="left">
                    {t('fields:chooseFromExisting')}
                  </Button>
                </ListDrawerToggler>
                <ListDrawer
                  enableRowSelections={hasMany}
                  onBulkSelect={onListBulkSelect}
                  onSelect={onListSelect}
                />
              </div>

              <p className={`${baseClass}__dragAndDropText`}>
                {t('general:or')} {t('upload:dragAndDrop')}
              </p>
            </div>
          </DropzoneShell>
        ) : null}
      </div>
    </div>
  )
}

export const UploadField = withCondition(UploadComponent)
