'use client'

import React, { useCallback, useEffect } from 'react'

import type { EditFormProps } from './types.js'

import { Form, useForm } from '../../../forms/Form/index.js'
import { type FormProps } from '../../../forms/Form/types.js'
import { WatchChildErrors } from '../../../forms/WatchChildErrors/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { OperationProvider } from '../../../providers/Operation/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js'
import { useDocumentDrawerContext } from '../../DocumentDrawer/Provider.js'
import { DocumentFields } from '../../DocumentFields/index.js'
import { MoveDocToFolder } from '../../FolderView/MoveDocToFolder/index.js'
import { Upload_v4 } from '../../Upload/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered

export function EditForm({
  resetUploadEdits,
  submitted,
  updateUploadEdits,
  uploadEdits,
}: EditFormProps) {
  const {
    action,
    collectionSlug: docSlug,
    docPermissions,
    getDocPreferences,
    hasSavePermission,
    initialState,
    isInitializing,
    Upload: CustomUpload,
  } = useDocumentInfo()

  const { drawerSlug, onSave: onSaveFromContext } = useDocumentDrawerContext()

  const { getFormState } = useServerFunctions()

  const {
    config: { folders },
    getEntityConfig,
  } = useConfig()

  const abortOnChangeRef = React.useRef<AbortController>(null)

  const collectionConfig = getEntityConfig({ collectionSlug: docSlug })
  const { reportUpdate } = useDocumentEvents()

  const collectionSlug = collectionConfig.slug

  const [schemaPath] = React.useState(collectionSlug)

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        doc: json?.doc || json?.result,
        drawerSlug,
        entitySlug: collectionSlug,
        operation: 'create',
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: 'create',
        })
      }
      resetUploadEdits()
    },
    [collectionSlug, onSaveFromContext, reportUpdate, resetUploadEdits, drawerSlug],
  )

  const onChange: NonNullable<FormProps['onChange']>[0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      const docPreferences = await getDocPreferences()

      const { state: newFormState } = await getFormState({
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        operation: 'create',
        schemaPath,
        signal: controller.signal,
        skipValidation: !submitted,
      })

      abortOnChangeRef.current = null

      return newFormState
    },
    [collectionSlug, schemaPath, getDocPreferences, getFormState, docPermissions],
  )

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

  return (
    <OperationProvider operation="create">
      <Form
        action={action}
        className={`${baseClass}__form`}
        disabled={isInitializing || !hasSavePermission}
        initialState={isInitializing ? undefined : initialState}
        isInitializing={isInitializing}
        method="POST"
        onChange={[onChange]}
        onSuccess={onSave}
        submitted={submitted}
      >
        <DocumentFields
          BeforeFields={
            <React.Fragment>
              {CustomUpload || (
                <Upload_v4
                  collectionSlug={collectionConfig.slug}
                  customActions={[
                    folders && collectionConfig.folders && (
                      <MoveDocToFolder
                        buttonProps={{
                          buttonStyle: 'pill',
                          size: 'small',
                        }}
                        folderCollectionSlug={folders.slug}
                        folderFieldName={folders.fieldName}
                        key="move-doc-to-folder"
                      />
                    ),
                  ].filter(Boolean)}
                  initialState={initialState}
                  resetUploadEdits={resetUploadEdits}
                  updateUploadEdits={updateUploadEdits}
                  uploadConfig={collectionConfig.upload}
                  uploadEdits={uploadEdits}
                />
              )}
            </React.Fragment>
          }
          docPermissions={docPermissions}
          fields={collectionConfig.fields}
          schemaPathSegments={[collectionConfig.slug]}
        />
        <ReportAllErrors />
        <GetFieldProxy />
      </Form>
    </OperationProvider>
  )
}

function GetFieldProxy() {
  const { getField, getFields } = useForm()
  const { getFormDataRef, getFormFileRef } = useFormsManager()

  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler -- TODO: fix
    getFormDataRef.current = getFields
    getFormFileRef.current = () => getField('file')?.value
  }, [getFields, getField, getFormDataRef, getFormFileRef])

  return null
}

function ReportAllErrors() {
  const { docConfig } = useDocumentInfo()
  const { activeIndex, getFormFileRef, setFormTotalErrorCount } = useFormsManager()
  const errorCountRef = React.useRef(0)
  const prevActiveIndexRef = React.useRef(activeIndex)

  const reportFormErrorCount = React.useCallback(
    (errorCount) => {
      // Reset error count ref when active form changes
      if (prevActiveIndexRef.current !== activeIndex) {
        errorCountRef.current = 0
        prevActiveIndexRef.current = activeIndex
      }

      // Get current file state from the live form via ref
      const fileValue = getFormFileRef.current?.()
      const hasFile = Boolean(fileValue)
      const totalErrorCount = errorCount + (hasFile ? 0 : 1)

      if (totalErrorCount === errorCountRef.current) {
        return
      }

      setFormTotalErrorCount({ errorCount: totalErrorCount, index: activeIndex })
      errorCountRef.current = totalErrorCount
    },
    [activeIndex, setFormTotalErrorCount, getFormFileRef],
  )

  if (!docConfig) {
    return null
  }

  return (
    <WatchChildErrors fields={docConfig.fields} path={[]} setErrorCount={reportFormErrorCount} />
  )
}
