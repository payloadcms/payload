'use client'

import type { JsonObject, UploadFieldProps, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo } from 'react'

import type { FieldType } from '../../forms/useField/index.js'
import type { UploadInputProps } from './HasOne/Input.js'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
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

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { permissions } = useAuth()
  const { code } = useLocale()
  const { i18n } = useTranslation()
  const { config } = useConfig()
  const { openModal } = useModal()
  const { drawerSlug, setCollectionSlug, setInitialFiles, setOnSuccess } = useBulkUpload()

  const fileDocs = React.useRef<JsonObject[]>([])
  const loadedValueDocsRef = React.useRef<boolean>(false)

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

  const populateDocs = React.useCallback(
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
    (newDocs: JsonObject[]) => {
      if (hasMany) {
        const mergedValue = [
          ...(Array.isArray(fieldHookResult.value) ? fieldHookResult.value : []),
          ...newDocs.map((doc) => doc.id),
        ]
        setValue(mergedValue)
        fileDocs.current.push(...newDocs)
      } else {
        const firstDoc = newDocs[0]
        setValue(firstDoc.id)
        fileDocs.current = [firstDoc]
      }
    },
    [fieldHookResult.value, hasMany, setValue],
  )

  const onFileSelection = useCallback(
    (files: FileList) => {
      setCollectionSlug(relationTo)
      setInitialFiles(files)
      setOnSuccess(onUploadSuccess)
      openModal(drawerSlug)
    },
    [
      openModal,
      drawerSlug,
      relationTo,
      setCollectionSlug,
      setInitialFiles,
      setOnSuccess,
      onUploadSuccess,
    ],
  )

  useEffect(() => {
    if (value && !loadedValueDocsRef.current) {
      void populateDocs(Array.isArray(value) ? value : [value])
      loadedValueDocsRef.current = true
    }
  }, [hasMany, populateDocs, value])

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

      {!fieldHookResult.value ||
      (Array.isArray(fieldHookResult.value) && fieldHookResult.value.length === 0) ? (
        <Dropzone multipleFiles={hasMany} onChange={onFileSelection} />
      ) : hasMany ? (
        <UploadComponentHasMany
          {...props}
          canCreate={canCreate}
          disabled={disabled}
          fieldHookResult={fieldHookResult as FieldType<string[]>}
          fileDocs={Array.isArray(fileDocs.current) ? fileDocs.current : []}
          onChange={onChange}
        />
      ) : (
        <UploadComponentHasOne
          {...props}
          canCreate={canCreate}
          disabled={disabled}
          fieldHookResult={fieldHookResult as FieldType<string>}
          fileDoc={fileDocs?.current?.[0]}
          onChange={onChange}
        />
      )}
    </div>
  )
}

export const UploadField = withCondition(UploadComponent)
