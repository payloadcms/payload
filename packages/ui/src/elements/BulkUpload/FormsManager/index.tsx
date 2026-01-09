'use client'

import type {
  CollectionSlug,
  Data,
  DocumentSlots,
  FormState,
  JsonObject,
  SanitizedDocumentPermissions,
  UploadEdits,
} from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { State } from './reducer.js'

import { fieldReducer } from '../../../forms/Form/fieldReducer.js'
import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useUploadHandlers } from '../../../providers/UploadHandlers/index.js'
import { hasSavePermission as getHasSavePermission } from '../../../utilities/hasSavePermission.js'
import { LoadingOverlay } from '../../Loading/index.js'
import { useLoadingOverlay } from '../../LoadingOverlay/index.js'
import { useBulkUpload } from '../index.js'
import { createFormData } from './createFormData.js'
import { formsManagementReducer } from './reducer.js'

type FormsManagerContext = {
  readonly activeIndex: State['activeIndex']
  readonly addFiles: (filelist: FileList) => Promise<void>
  readonly bulkUpdateForm: (
    updatedFields: Record<string, unknown>,
    afterStateUpdate?: () => void,
  ) => Promise<void>
  readonly collectionSlug: string
  readonly docPermissions?: SanitizedDocumentPermissions
  readonly documentSlots: DocumentSlots
  readonly forms: State['forms']
  getFormDataRef: React.RefObject<() => Data>
  getFormFileRef: React.RefObject<() => unknown>
  readonly hasPublishPermission: boolean
  readonly hasSavePermission: boolean
  readonly hasSubmitted: boolean
  readonly isInitializing: boolean
  readonly removeFile: (index: number) => void
  readonly resetUploadEdits?: () => void
  readonly saveAllDocs: ({ overrides }?: { overrides?: Record<string, unknown> }) => Promise<void>
  readonly setActiveIndex: (index: number) => void
  readonly setFormTotalErrorCount: ({
    errorCount,
    index,
  }: {
    errorCount: number
    index: number
  }) => void
  readonly totalErrorCount?: number
  readonly updateUploadEdits: (args: UploadEdits) => void
}

const Context = React.createContext<FormsManagerContext>({
  activeIndex: 0,
  addFiles: () => Promise.resolve(),
  bulkUpdateForm: () => null,
  collectionSlug: '',
  docPermissions: undefined,
  documentSlots: {},
  forms: [],
  getFormDataRef: { current: () => ({}) },
  getFormFileRef: { current: () => null },
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isInitializing: false,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  totalErrorCount: 0,
  updateUploadEdits: () => {},
})

const initialState: State = {
  activeIndex: 0,
  forms: [],
  totalErrorCount: 0,
}

export type InitialForms = Array<{
  file: File
  formID?: string
  initialState?: FormState | null
}>

type FormsManagerProps = {
  readonly children: React.ReactNode
}

export function FormsManagerProvider({ children }: FormsManagerProps) {
  const { config } = useConfig()
  const {
    routes: { api },
  } = config
  const { code } = useLocale()
  const { i18n, t } = useTranslation()

  const { getDocumentSlots, getFormState } = useServerFunctions()
  const { getUploadHandler } = useUploadHandlers()

  const [documentSlots, setDocumentSlots] = React.useState<DocumentSlots>({})
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [docPermissions, setDocPermissions] = React.useState<SanitizedDocumentPermissions>()
  const [hasSavePermission, setHasSavePermission] = React.useState(false)
  const [hasPublishPermission, setHasPublishPermission] = React.useState(false)
  const [hasInitializedState, setHasInitializedState] = React.useState(false)
  const [hasInitializedDocPermissions, setHasInitializedDocPermissions] = React.useState(false)
  const [isInitializing, setIsInitializing] = React.useState(false)
  const [state, dispatch] = React.useReducer(formsManagementReducer, initialState)
  const { activeIndex, forms, totalErrorCount } = state

  const formsRef = React.useRef(forms)
  formsRef.current = forms

  const { toggleLoadingOverlay } = useLoadingOverlay()
  const { closeModal } = useModal()
  const {
    collectionSlug,
    drawerSlug,
    initialFiles,
    initialForms,
    onSuccess,
    setInitialFiles,
    setInitialForms,
    setSuccessfullyUploaded,
  } = useBulkUpload()

  const [isUploading, setIsUploading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState('')

  const hasInitializedWithFiles = React.useRef(false)
  const initialStateRef = React.useRef<FormState>(null)
  const getFormDataRef = React.useRef<() => Data>(() => ({}))
  const getFormFileRef = React.useRef<() => unknown>(() => null)

  const baseAPIPath = formatAdminURL({
    apiRoute: api,
    path: '',
  })

  const actionURL = `${baseAPIPath}/${collectionSlug}`

  const initializeSharedDocPermissions = React.useCallback(async () => {
    const params = {
      locale: code || undefined,
    }

    const docAccessURL = `/${collectionSlug}/access`
    const res = await fetch(`${baseAPIPath}${docAccessURL}?${qs.stringify(params)}`, {
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
      method: 'post',
    })

    const json: SanitizedDocumentPermissions = await res.json()
    const publishedAccessJSON = await fetch(
      `${baseAPIPath}${docAccessURL}?${qs.stringify(params)}`,
      {
        body: JSON.stringify({
          _status: 'published',
        }),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ).then((res) => res.json())

    setDocPermissions(json)

    setHasSavePermission(
      getHasSavePermission({
        collectionSlug,
        docPermissions: json,
        isEditing: false,
      }),
    )

    setHasPublishPermission(publishedAccessJSON?.update)
    setHasInitializedDocPermissions(true)
  }, [baseAPIPath, code, collectionSlug, i18n.language])

  const initializeSharedFormState = React.useCallback(
    async (abortController?: AbortController) => {
      if (abortController?.signal) {
        abortController.abort('aborting previous fetch for initial form state without files')
      }

      // FETCH AND SET THE DOCUMENT SLOTS HERE!
      const documentSlots = await getDocumentSlots({ collectionSlug })
      setDocumentSlots(documentSlots)

      try {
        const { state: formStateWithoutFiles } = await getFormState({
          collectionSlug,
          docPermissions,
          docPreferences: { fields: {} },
          locale: code,
          operation: 'create',
          renderAllFields: true,
          schemaPath: collectionSlug,
          skipValidation: true,
        })
        initialStateRef.current = formStateWithoutFiles
        setHasInitializedState(true)
      } catch (_err) {
        // swallow error
      }
    },
    [getDocumentSlots, collectionSlug, getFormState, docPermissions, code],
  )

  const setActiveIndex: FormsManagerContext['setActiveIndex'] = React.useCallback(
    (index: number) => {
      const currentFormsData = getFormDataRef.current()
      dispatch({
        type: 'REPLACE',
        state: {
          activeIndex: index,
          forms: forms.map((form, i) => {
            if (i === activeIndex) {
              return {
                errorCount: form.errorCount,
                exceedsLimit: form.exceedsLimit,
                formID: form.formID,
                formState: currentFormsData,
                missingFile: form.missingFile,
                uploadEdits: form.uploadEdits,
              }
            }
            return form
          }),
        },
      })
    },
    [forms, activeIndex],
  )

  const addFiles = React.useCallback(
    async (files: FileList) => {
      if (forms.length) {
        // save the state of the current form before adding new files
        dispatch({
          type: 'UPDATE_FORM',
          errorCount: forms[activeIndex].errorCount,
          exceedsLimit: forms[activeIndex].exceedsLimit,
          formState: getFormDataRef.current(),
          index: activeIndex,
          missingFile: forms[activeIndex].missingFile,
        })
      }

      toggleLoadingOverlay({ isLoading: true, key: 'addingDocs' })
      if (!hasInitializedState) {
        await initializeSharedFormState()
      }
      dispatch({
        type: 'ADD_FORMS',
        forms: Array.from(files).map((file) => ({
          file,
          initialState: initialStateRef.current,
        })),
      })
      toggleLoadingOverlay({ isLoading: false, key: 'addingDocs' })
    },
    [initializeSharedFormState, hasInitializedState, toggleLoadingOverlay, activeIndex, forms],
  )

  const addFilesEffectEvent = useEffectEvent(addFiles)

  const addInitialForms = useEffectEvent(async (initialForms: InitialForms) => {
    toggleLoadingOverlay({ isLoading: true, key: 'addingDocs' })

    if (!hasInitializedState) {
      await initializeSharedFormState()
    }

    dispatch({
      type: 'ADD_FORMS',
      forms: initialForms.map((form) => ({
        ...form,
        initialState: form?.initialState || initialStateRef.current,
      })),
    })

    toggleLoadingOverlay({ isLoading: false, key: 'addingDocs' })
  })

  const removeFile: FormsManagerContext['removeFile'] = React.useCallback((index) => {
    dispatch({ type: 'REMOVE_FORM', index })
  }, [])

  const setFormTotalErrorCount: FormsManagerContext['setFormTotalErrorCount'] = React.useCallback(
    ({ errorCount, index }) => {
      dispatch({
        type: 'UPDATE_ERROR_COUNT',
        count: errorCount,
        index,
      })
    },
    [],
  )

  const saveAllDocs: FormsManagerContext['saveAllDocs'] = React.useCallback(
    async ({ overrides } = {}) => {
      const currentFormsData = getFormDataRef.current()
      const currentForms = [...forms]
      currentForms[activeIndex] = {
        errorCount: currentForms[activeIndex].errorCount,
        exceedsLimit: currentForms[activeIndex].exceedsLimit,
        formID: currentForms[activeIndex].formID,
        formState: currentFormsData,
        missingFile: currentForms[activeIndex].missingFile,
        uploadEdits: currentForms[activeIndex].uploadEdits,
      }
      const newDocs: Array<{
        collectionSlug: CollectionSlug
        doc: JsonObject
        /**
         * ID of the form that created this document
         */
        formID: string
      }> = []

      setIsUploading(true)

      for (let i = 0; i < currentForms.length; i++) {
        try {
          const form = currentForms[i]
          const fileValue = form.formState?.file?.value

          // Skip upload if file is missing a filename
          if (
            fileValue &&
            typeof fileValue === 'object' &&
            'name' in fileValue &&
            (!fileValue.name || fileValue.name === '')
          ) {
            currentForms[i] = {
              ...currentForms[i],
              errorCount: 1,
              exceedsLimit: false,
              missingFile: true,
            }
            continue
          }

          setLoadingText(t('general:uploadingBulk', { current: i + 1, total: currentForms.length }))

          const actionURLWithParams = `${actionURL}${qs.stringify(
            {
              locale: code,
              uploadEdits: form?.uploadEdits || undefined,
            },
            {
              addQueryPrefix: true,
            },
          )}`

          const req = await fetch(actionURLWithParams, {
            body: await createFormData(
              form.formState,
              overrides,
              collectionSlug,
              getUploadHandler({ collectionSlug }),
            ),
            credentials: 'include',
            method: 'POST',
          })

          const json = await req.json()

          if (req.status === 201 && json?.doc) {
            newDocs.push({
              collectionSlug,
              doc: json.doc,
              formID: form.formID,
            })
          }

          // should expose some sort of helper for this
          const [fieldErrors, nonFieldErrors] = (json?.errors || []).reduce(
            ([fieldErrs, nonFieldErrs], err) => {
              const newFieldErrs: any[] = []
              const newNonFieldErrs: any[] = []

              if (err?.message) {
                newNonFieldErrs.push(err)
              }

              if (Array.isArray(err?.data?.errors)) {
                err.data?.errors.forEach((dataError) => {
                  if (dataError?.path) {
                    newFieldErrs.push(dataError)
                  } else {
                    newNonFieldErrs.push(dataError)
                  }
                })
              }

              return [
                [...fieldErrs, ...newFieldErrs],
                [...nonFieldErrs, ...newNonFieldErrs],
              ]
            },
            [[], []],
          )

          const exceedsLimit = req.status === 413
          const missingFile = req.status === 400 && !fileValue

          currentForms[i] = {
            errorCount: fieldErrors.length + (missingFile || exceedsLimit ? 1 : 0),
            exceedsLimit,
            formID: currentForms[i].formID,
            formState: fieldReducer(currentForms[i].formState, {
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            }),
            missingFile,
          }

          if (currentForms[i].missingFile || currentForms[i].exceedsLimit) {
            toast.error(nonFieldErrors[0]?.message)
          }
        } catch (_) {
          // swallow
        }
      }

      setHasSubmitted(true)
      setLoadingText('')
      setIsUploading(false)

      const remainingForms = []

      currentForms.forEach(({ errorCount }, i) => {
        if (errorCount) {
          remainingForms.push(currentForms[i])
        }
      })

      const successCount = Math.max(0, currentForms.length - remainingForms.length)
      const errorCount = currentForms.length - successCount

      if (successCount) {
        toast.success(`Successfully saved ${successCount} files`)
        setSuccessfullyUploaded(true)

        if (typeof onSuccess === 'function') {
          onSuccess(newDocs, errorCount)
        }
      }

      if (errorCount) {
        toast.error(`Failed to save ${errorCount} files`)
      } else {
        closeModal(drawerSlug)
      }

      dispatch({
        type: 'REPLACE',
        state: {
          activeIndex: 0,
          forms: remainingForms,
          totalErrorCount: remainingForms.reduce((acc, { errorCount }) => acc + errorCount, 0),
        },
      })

      if (remainingForms.length === 0) {
        setInitialFiles(undefined)
        setInitialForms(undefined)
      }
    },
    [
      forms,
      activeIndex,
      t,
      actionURL,
      code,
      collectionSlug,
      getUploadHandler,
      onSuccess,
      closeModal,
      setSuccessfullyUploaded,
      drawerSlug,
      setInitialFiles,
      setInitialForms,
    ],
  )

  const bulkUpdateForm = React.useCallback(
    async (updatedFields: Record<string, unknown>, afterStateUpdate?: () => void) => {
      for (let i = 0; i < forms.length; i++) {
        Object.entries(updatedFields).forEach(([path, value]) => {
          if (forms[i].formState[path]) {
            forms[i].formState[path].value = value

            dispatch({
              type: 'UPDATE_FORM',
              errorCount: forms[i].errorCount,
              exceedsLimit: forms[i].exceedsLimit,
              formState: forms[i].formState,
              index: i,
              missingFile: forms[i].missingFile,
            })
          }
        })

        if (typeof afterStateUpdate === 'function') {
          afterStateUpdate()
        }

        if (hasSubmitted) {
          const { state } = await getFormState({
            collectionSlug,
            docPermissions,
            docPreferences: null,
            formState: forms[i].formState,
            operation: 'create',
            schemaPath: collectionSlug,
          })

          const newFormErrorCount = Object.values(state).reduce(
            (acc, value) => (value?.valid === false ? acc + 1 : acc),
            0,
          )

          dispatch({
            type: 'UPDATE_FORM',
            errorCount: newFormErrorCount,
            exceedsLimit: forms[i].exceedsLimit,
            formState: state,
            index: i,
            missingFile: forms[i].missingFile,
          })
        }
      }
    },
    [collectionSlug, docPermissions, forms, getFormState, hasSubmitted],
  )

  const updateUploadEdits = React.useCallback<FormsManagerContext['updateUploadEdits']>(
    (uploadEdits) => {
      dispatch({
        type: 'UPDATE_FORM',
        errorCount: forms[activeIndex].errorCount,
        exceedsLimit: forms[activeIndex].exceedsLimit,
        formState: forms[activeIndex].formState,
        index: activeIndex,
        missingFile: forms[activeIndex].missingFile,
        uploadEdits,
      })
    },
    [activeIndex, forms],
  )

  const resetUploadEdits = React.useCallback<FormsManagerContext['resetUploadEdits']>(() => {
    dispatch({
      type: 'REPLACE',
      state: {
        forms: forms.map((form) => ({
          ...form,
          uploadEdits: {},
        })),
      },
    })
  }, [forms])

  React.useEffect(() => {
    if (!collectionSlug) {
      return
    }
    if (!hasInitializedState) {
      void initializeSharedFormState()
    }

    if (!hasInitializedDocPermissions) {
      void initializeSharedDocPermissions()
    }

    if (initialFiles || initialForms) {
      if (!hasInitializedState || !hasInitializedDocPermissions) {
        setIsInitializing(true)
      } else {
        setIsInitializing(false)
      }
    }

    if (
      hasInitializedState &&
      (initialForms?.length || initialFiles?.length) &&
      !hasInitializedWithFiles.current
    ) {
      if (initialForms?.length) {
        void addInitialForms(initialForms)
      }
      if (initialFiles?.length) {
        void addFilesEffectEvent(initialFiles)
      }
      hasInitializedWithFiles.current = true
    }
    return
  }, [
    initialFiles,
    initializeSharedFormState,
    initializeSharedDocPermissions,
    collectionSlug,
    hasInitializedState,
    hasInitializedDocPermissions,
    initialForms,
  ])

  return (
    <Context
      value={{
        activeIndex: state.activeIndex,
        addFiles,
        bulkUpdateForm,
        collectionSlug,
        docPermissions,
        documentSlots,
        forms,
        getFormDataRef,
        getFormFileRef,
        hasPublishPermission,
        hasSavePermission,
        hasSubmitted,
        isInitializing,
        removeFile,
        resetUploadEdits,
        saveAllDocs,
        setActiveIndex,
        setFormTotalErrorCount,
        totalErrorCount,
        updateUploadEdits,
      }}
    >
      {isUploading && (
        <LoadingOverlay
          animationDuration="250ms"
          loadingText={loadingText}
          overlayType="fullscreen"
          show
        />
      )}
      {children}
    </Context>
  )
}

export function useFormsManager() {
  return React.use(Context)
}
