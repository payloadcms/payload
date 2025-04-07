'use client'

import type {
  Data,
  DocumentSlots,
  FormState,
  SanitizedDocumentPermissions,
  UploadEdits,
} from 'payload'

import { useModal } from '@faceless-ui/modal'
import { isImage } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { State } from './reducer.js'

import { fieldReducer } from '../../../forms/Form/fieldReducer.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useUploadHandlers } from '../../../providers/UploadHandlers/index.js'
import { hasSavePermission as getHasSavePermission } from '../../../utilities/hasSavePermission.js'
import { LoadingOverlay } from '../../Loading/index.js'
import { useLoadingOverlay } from '../../LoadingOverlay/index.js'
import { createThumbnail } from '../../Thumbnail/createThumbnail.js'
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
  readonly thumbnailUrls: string[]
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
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isInitializing: false,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  thumbnailUrls: [],
  totalErrorCount: 0,
  updateUploadEdits: () => {},
})

const initialState: State = {
  activeIndex: 0,
  forms: [],
  totalErrorCount: 0,
}

type FormsManagerProps = {
  readonly children: React.ReactNode
}

export function FormsManagerProvider({ children }: FormsManagerProps) {
  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
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
  const formsCount = forms.length

  const thumbnailUrlsRef = React.useRef<string[]>([])
  const processedFiles = React.useRef(new Set()) // Track already-processed files
  const [renderedThumbnails, setRenderedThumbnails] = React.useState<string[]>([])

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const newThumbnails = [...thumbnailUrlsRef.current]

      for (let i = 0; i < formsCount; i++) {
        const file = formsRef.current[i].formState.file.value as File

        // Skip if already processed
        if (processedFiles.current.has(file) || !file || !isImage(file.type)) {
          continue
        }
        processedFiles.current.add(file)

        // Generate thumbnail and update ref
        const thumbnailUrl = await createThumbnail(file)
        newThumbnails[i] = thumbnailUrl
        thumbnailUrlsRef.current = newThumbnails

        // Trigger re-render in batches
        setRenderedThumbnails([...newThumbnails])
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    })()
  }, [formsCount])

  const { toggleLoadingOverlay } = useLoadingOverlay()
  const { closeModal } = useModal()
  const { collectionSlug, drawerSlug, initialFiles, onSuccess } = useBulkUpload()

  const [isUploading, setIsUploading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState('')

  const hasInitializedWithFiles = React.useRef(false)
  const initialStateRef = React.useRef<FormState>(null)
  const getFormDataRef = React.useRef<() => Data>(() => ({}))

  const actionURL = `${api}/${collectionSlug}`

  const initializeSharedDocPermissions = React.useCallback(async () => {
    const params = {
      locale: code || undefined,
    }

    const docAccessURL = `/${collectionSlug}/access`
    const res = await fetch(`${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`, {
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
      method: 'post',
    })

    const json: SanitizedDocumentPermissions = await res.json()
    const publishedAccessJSON = await fetch(
      `${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`,
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
  }, [api, code, collectionSlug, i18n.language, serverURL])

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
                formState: currentFormsData,
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
      toggleLoadingOverlay({ isLoading: true, key: 'addingDocs' })
      if (!hasInitializedState) {
        await initializeSharedFormState()
      }
      dispatch({ type: 'ADD_FORMS', files, initialState: initialStateRef.current })
      toggleLoadingOverlay({ isLoading: false, key: 'addingDocs' })
    },
    [initializeSharedFormState, hasInitializedState, toggleLoadingOverlay],
  )

  const removeThumbnails = React.useCallback((indexes: number[]) => {
    thumbnailUrlsRef.current = thumbnailUrlsRef.current.filter((_, i) => !indexes.includes(i))
    setRenderedThumbnails([...thumbnailUrlsRef.current])
  }, [])

  const removeFile: FormsManagerContext['removeFile'] = React.useCallback(
    (index) => {
      dispatch({ type: 'REMOVE_FORM', index })
      removeThumbnails([index])
    },
    [removeThumbnails],
  )

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
        formState: currentFormsData,
        uploadEdits: currentForms[activeIndex].uploadEdits,
      }
      const newDocs = []

      setIsUploading(true)

      for (let i = 0; i < currentForms.length; i++) {
        try {
          const form = currentForms[i]

          setLoadingText(t('general:uploadingBulk', { current: i + 1, total: currentForms.length }))

          const actionURLWithParams = `${actionURL}${qs.stringify(
            {
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
            method: 'POST',
          })

          const json = await req.json()

          if (req.status === 201 && json?.doc) {
            newDocs.push(json.doc)
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

          currentForms[i] = {
            errorCount: fieldErrors.length,
            formState: fieldReducer(currentForms[i].formState, {
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            }),
          }

          if (req.status === 413 || req.status === 400) {
            // file too large
            currentForms[i] = {
              ...currentForms[i],
              errorCount: currentForms[i].errorCount + 1,
            }

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
      const thumbnailIndexesToRemove = []

      currentForms.forEach(({ errorCount }, i) => {
        if (errorCount) {
          remainingForms.push(currentForms[i])
        } else {
          thumbnailIndexesToRemove.push(i)
        }
      })

      const successCount = Math.max(0, currentForms.length - remainingForms.length)
      const errorCount = currentForms.length - successCount

      if (successCount) {
        toast.success(`Successfully saved ${successCount} files`)

        if (typeof onSuccess === 'function') {
          onSuccess(newDocs, errorCount)
        }

        if (remainingForms.length && thumbnailIndexesToRemove.length) {
          removeThumbnails(thumbnailIndexesToRemove)
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
    },
    [
      actionURL,
      activeIndex,
      forms,
      removeThumbnails,
      onSuccess,
      collectionSlug,
      getUploadHandler,
      t,
      closeModal,
      drawerSlug,
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
              formState: forms[i].formState,
              index: i,
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
            formState: state,
            index: i,
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
        formState: forms[activeIndex].formState,
        index: activeIndex,
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

    if (initialFiles) {
      if (!hasInitializedState || !hasInitializedDocPermissions) {
        setIsInitializing(true)
      } else {
        setIsInitializing(false)
      }
    }

    if (hasInitializedState && initialFiles && !hasInitializedWithFiles.current) {
      void addFiles(initialFiles)
      hasInitializedWithFiles.current = true
    }
    return
  }, [
    addFiles,
    initialFiles,
    initializeSharedFormState,
    initializeSharedDocPermissions,
    collectionSlug,
    hasInitializedState,
    hasInitializedDocPermissions,
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
        hasPublishPermission,
        hasSavePermission,
        hasSubmitted,
        isInitializing,
        removeFile,
        resetUploadEdits,
        saveAllDocs,
        setActiveIndex,
        setFormTotalErrorCount,
        thumbnailUrls: renderedThumbnails,
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
