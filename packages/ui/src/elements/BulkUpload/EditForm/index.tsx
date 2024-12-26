'use client'

import type { ClientCollectionConfig } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import React, { useCallback, useEffect } from 'react'

import type { EditFormProps } from './types.js'

import { Form, useForm } from '../../../forms/Form/index.js'
import { type FormProps } from '../../../forms/Form/types.js'
import { WatchChildErrors } from '../../../forms/WatchChildErrors/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { OperationProvider } from '../../../providers/Operation/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useUploadEdits } from '../../../providers/UploadEdits/index.js'
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { useDocumentDrawerContext } from '../../DocumentDrawer/Provider.js'
import { DocumentFields } from '../../DocumentFields/index.js'
import { Upload } from '../../Upload/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { BulkUploadProvider } from '../index.js'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered

export function EditForm({ submitted }: EditFormProps) {
  const {
    action,
    collectionSlug: docSlug,
    docPermissions,
    getDocPreferences,
    hasSavePermission,
    initialState,
    isEditing,
    isInitializing,
    Upload: CustomUpload,
  } = useDocumentInfo()

  const { onSave: onSaveFromContext } = useDocumentDrawerContext()

  const { getFormState } = useServerFunctions()

  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()

  const abortOnChangeRef = React.useRef<AbortController>(null)

  const collectionConfig = getEntityConfig({ collectionSlug: docSlug }) as ClientCollectionConfig
  const router = useRouter()
  const depth = useEditDepth()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()

  const locale = params.get('locale')

  const collectionSlug = collectionConfig.slug

  const [schemaPath] = React.useState(collectionSlug)

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        entitySlug: collectionSlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: 'create',
        })
      }

      if (!isEditing && depth < 2) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`,
        })
        router.push(redirectRoute)
      } else {
        resetUploadEdits()
      }
    },
    [
      adminRoute,
      collectionSlug,
      depth,
      isEditing,
      locale,
      onSaveFromContext,
      reportUpdate,
      resetUploadEdits,
      router,
    ],
  )

  const onChange: NonNullable<FormProps['onChange']>[0] = useCallback(
    async ({ formState: prevFormState }) => {
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
      <BulkUploadProvider>
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
                  <Upload
                    collectionSlug={collectionConfig.slug}
                    initialState={initialState}
                    uploadConfig={collectionConfig.upload}
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
      </BulkUploadProvider>
    </OperationProvider>
  )
}

function GetFieldProxy() {
  const { getFields } = useForm()
  const { getFormDataRef } = useFormsManager()

  React.useEffect(() => {
    getFormDataRef.current = getFields
  }, [getFields, getFormDataRef])

  return null
}

function ReportAllErrors() {
  const { docConfig } = useDocumentInfo()
  const { activeIndex, setFormTotalErrorCount } = useFormsManager()
  const errorCountRef = React.useRef(0)

  const reportFormErrorCount = React.useCallback(
    (errorCount) => {
      if (errorCount === errorCountRef.current) {
        return
      }
      setFormTotalErrorCount({ errorCount, index: activeIndex })
      errorCountRef.current = errorCount
    },
    [activeIndex, setFormTotalErrorCount],
  )

  if (!docConfig) {
    return null
  }

  return (
    <WatchChildErrors fields={docConfig.fields} path={[]} setErrorCount={reportFormErrorCount} />
  )
}
