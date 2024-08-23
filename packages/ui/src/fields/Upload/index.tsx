'use client'

import type { JsonObject, UploadFieldProps, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo } from 'react'

import type { FieldType } from '../../forms/useField/index.js'
import type { UploadInputProps } from './HasOne/Input.js'

import { BulkUploadDrawer } from '../../elements/BulkUpload/index.js'
import { Dropzone } from '../../elements/Dropzone/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { UploadComponentHasMany } from './HasMany/index.js'
import { UploadInputHasOne } from './HasOne/Input.js'
import { UploadComponentHasOne } from './HasOne/index.js'

export { UploadFieldProps, UploadInputHasOne as UploadInput }
export type { UploadInputProps }

export const baseClass = 'upload'

const UploadComponent: React.FC<UploadFieldProps> = (props) => {
  const {
    field: {
      name,
      _path: pathFromProps,
      admin: { className, components, readOnly: readOnlyFromAdmin, style, width } = {},
      hasMany,
      label,
      relationTo,
      required,
    },
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const drawerSlug = `bulk-upload-drawer--field-${name}`

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { permissions } = useAuth()
  const { code } = useLocale()
  const { i18n } = useTranslation()
  const { config } = useConfig()
  const { closeModal, openModal } = useModal()

  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null)
  const fileDocs = React.useRef<JsonObject | JsonObject[]>([])

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  // Checks if the user has permissions to create a new document in the related collection
  const canCreate = useMemo(() => {
    if (typeof relationTo === 'string') {
      if (permissions?.collections && permissions.collections?.[relationTo]?.create) {
        if (permissions.collections[relationTo].create?.permission === true) {
          return true
        }
      }
    }

    return false
  }, [relationTo, permissions])

  const fieldHookResult = useField<string | string[]>({
    path: pathFromContext ?? pathFromProps,
    validate: memoizedValidate,
  })

  const { setValue, value } = useMemo(
    () => ({ setValue: fieldHookResult.setValue, value: fieldHookResult.value }),
    [fieldHookResult],
  )

  const disabled =
    readOnlyFromProps ||
    readOnlyFromContext ||
    fieldHookResult.formProcessing ||
    fieldHookResult.formInitializing

  const loadFileDocs = React.useCallback(
    async (ids: (number | string)[]) => {
      const query: {
        [key: string]: unknown
        where: Where
      } = {
        depth: 0,
        draft: true,
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

      const response = await fetch(`${config.serverURL}${config.routes.api}/${relationTo}`, {
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
        fileDocs.current = hasMany ? json.docs : json.docs[0]
        //setFileDocs(hasMany ? json.docs : json.docs[0])
      } else {
        // setMissingFiles(true)
        //setFileDocs([])
      }
    },
    [code, config.routes.api, config.serverURL, hasMany, i18n.language, relationTo],
  )

  useEffect(() => {
    if (hasMany) {
      void loadFileDocs(Array.isArray(value) ? value : [value])
    }
  }, [hasMany, loadFileDocs, value])

  const onChange = useCallback(
    (incomingValue) => {
      if (!incomingValue) {
        setValue(hasMany ? [] : null)
      } else {
        if (Array.isArray(incomingValue)) {
          setValue([...value, ...incomingValue])
        } else {
          setValue(incomingValue)
        }
      }
    },
    [setValue, hasMany, value],
  )

  const onUploadSuccess = useCallback(
    (ids: string[]) => {
      if (hasMany) {
        const mergedValue = [
          ...(Array.isArray(fieldHookResult.value) ? fieldHookResult.value : []),
          ...ids,
        ]
        setValue(mergedValue)
        void loadFileDocs(mergedValue)
      } else {
        const firstDoc = ids[0]
        setValue(firstDoc)
        void loadFileDocs([firstDoc])
      }
    },
    [fieldHookResult.value, hasMany, loadFileDocs, setValue],
  )

  const onFileSelection = useCallback(
    (files: FileList) => {
      openModal(drawerSlug)
      setSelectedFiles(files)
    },
    [openModal, drawerSlug],
  )

  return (
    <div
      className={[
        // fieldBaseClass,
        baseClass,
        className,
        fieldHookResult.showError && 'error',
        fieldHookResult.readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        Label={components.Label}
        field={props.field}
        label={label}
        required={required}
        {...(props.labelProps || {})}
      />
      {/* <BulkUploadDrawer
        collectionSlug={relationTo}
        drawerSlug={drawerSlug}
        //initialFiles={selectedFiles}
        onSuccess={onUploadSuccess}
      /> */}

      {!fieldHookResult.value ||
      (Array.isArray(fieldHookResult.value) && fieldHookResult.value.length === 0) ? (
        <>
          <Dropzone multipleFiles={hasMany} onChange={onFileSelection} />
          <BulkUploadDrawer
            collectionSlug={relationTo}
            drawerSlug={drawerSlug}
            initialFiles={selectedFiles}
            onSuccess={onUploadSuccess}
          />
        </>
      ) : hasMany ? (
        <UploadComponentHasMany
          {...props}
          canCreate={canCreate}
          disabled={disabled}
          drawerSlug={drawerSlug}
          fieldHookResult={fieldHookResult as FieldType<string[]>}
          fileDocs={Array.isArray(fileDocs.current) ? fileDocs.current : []}
          onChange={onChange}
          onUploadSuccess={onUploadSuccess}
          selectedFiles={selectedFiles}
          //onFileSelection={onFileSelection}
        />
      ) : (
        <UploadComponentHasOne
          {...props}
          canCreate={canCreate}
          disabled={disabled}
          fieldHookResult={fieldHookResult as FieldType<string>}
          onChange={onChange}
        />
      )}
    </div>
  )
}

export const UploadField = withCondition(UploadComponent)
