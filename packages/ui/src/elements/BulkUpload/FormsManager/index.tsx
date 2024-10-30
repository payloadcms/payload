'use client'

import type { Data, DocumentPermissions, FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { State } from './reducer.js'

import { fieldReducer } from '../../../forms/Form/fieldReducer.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { getFormState } from '../../../utilities/getFormState.js'
import { hasSavePermission as getHasSavePermission } from '../../../utilities/hasSavePermission.js'
import { useLoadingOverlay } from '../../LoadingOverlay/index.js'
import { createThumbnail } from '../../Thumbnail/createThumbnail.js'
import { useBulkUpload } from '../index.js'
import { createFormData } from './createFormData.js'
import { formsManagementReducer } from './reducer.js'

type FormsManagerContext = {
  readonly activeIndex: State['activeIndex']
  readonly addFiles: (filelist: FileList) => Promise<void>
  readonly collectionSlug: string
  readonly docPermissions?: DocumentPermissions
  readonly forms: State['forms']
  getFormDataRef: React.RefObject<() => Data>
  readonly hasPublishPermission: boolean
  readonly hasSavePermission: boolean
  readonly hasSubmitted: boolean
  readonly isInitializing: boolean
  readonly removeFile: (index: number) => void
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
}

const Context = React.createContext<FormsManagerContext>({
  activeIndex: 0,
  addFiles: () => Promise.resolve(),
  collectionSlug: '',
  docPermissions: undefined,
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

  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [docPermissions, setDocPermissions] = React.useState<DocumentPermissions>()
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
        if (processedFiles.current.has(file) || !file) {
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
  }, [formsCount, createThumbnail])

  const { toggleLoadingOverlay } = useLoadingOverlay()
  const { closeModal } = useModal()
  const { collectionSlug, drawerSlug, initialFiles, onSuccess } = useBulkUpload()

  const hasInitializedWithFiles = React.useRef(false)
  const initialStateRef = React.useRef<FormState>(null)
  const getFormDataRef = React.useRef<() => Data>(() => ({}))

  const actionURL = `${api}/${collectionSlug}`

  const initilizeSharedDocPermissions = React.useCallback(async () => {
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

    const json: DocumentPermissions = await res.json()
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

    setHasPublishPermission(publishedAccessJSON?.update?.permission)
    setHasInitializedDocPermissions(true)
  }, [api, code, collectionSlug, i18n.language, serverURL])

  const initializeSharedFormState = React.useCallback(
    async (abortController?: AbortController) => {
      if (abortController?.signal) {
        abortController.abort('aborting previous fetch for initial form state without files')
      }

      try {
        const { state: formStateWithoutFiles } = await getFormState({
          apiRoute: config.routes.api,
          body: {
            collectionSlug,
            locale: code,
            operation: 'create',
            schemaPath: collectionSlug,
          },
          // onError: onLoadError,
          serverURL: config.serverURL,
          signal: abortController?.signal,
        })
        initialStateRef.current = formStateWithoutFiles
        setHasInitializedState(true)
      } catch (error) {
        // swallow error
      }
    },
    [code, collectionSlug, config.routes.api, config.serverURL],
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
        formState: currentFormsData,
      }
      const newDocs = []
      const promises = currentForms.map(async (form, i) => {
        try {
          toggleLoadingOverlay({
            isLoading: true,
            key: 'saveAllDocs',
            loadingText: t('general:uploading'),
          })
          const req = await fetch(actionURL, {
            body: createFormData(form.formState, overrides),
            method: 'POST',
          })

          const json = await req.json()

          if (req.status === 201 && json?.doc) {
            newDocs.push(json.doc)
          }

          // should expose some sort of helper for this
          if (json?.errors?.length) {
            const [fieldErrors, nonFieldErrors] = json.errors.reduce(
              ([fieldErrs, nonFieldErrs], err) => {
                const newFieldErrs: any[] = []
                const newNonFieldErrs: any[] = []

                if (err?.message) {
                  newNonFieldErrs.push(err)
                }

                if (Array.isArray(err?.data?.errors)) {
                  err.data?.errors.forEach((dataError) => {
                    if (dataError?.field) {
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
          }
        } catch (error) {
          // swallow error
        } finally {
          setHasSubmitted(true)
          toggleLoadingOverlay({ isLoading: false, key: 'saveAllDocs' })
        }
      })

      await Promise.all(promises)

      const remainingForms = currentForms.filter(({ errorCount }) => errorCount > 0)
      const successCount = Math.max(0, currentForms.length - remainingForms.length)
      const errorCount = currentForms.length - successCount

      if (successCount) {
        toast.success(`Successfully saved ${successCount} files`)

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
    },
    [actionURL, activeIndex, forms, onSuccess, t, toggleLoadingOverlay, closeModal, drawerSlug],
  )

  React.useEffect(() => {
    if (!collectionSlug) {
      return
    }
    if (!hasInitializedState) {
      void initializeSharedFormState()
    }

    if (!hasInitializedDocPermissions) {
      void initilizeSharedDocPermissions()
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
    initilizeSharedDocPermissions,
    collectionSlug,
    hasInitializedState,
    hasInitializedDocPermissions,
  ])

  return (
    <Context.Provider
      value={{
        activeIndex: state.activeIndex,
        addFiles,
        collectionSlug,
        docPermissions,
        forms,
        getFormDataRef,
        hasPublishPermission,
        hasSavePermission,
        hasSubmitted,
        isInitializing,
        removeFile,
        saveAllDocs,
        setActiveIndex,
        setFormTotalErrorCount,
        thumbnailUrls: renderedThumbnails,
        totalErrorCount,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useFormsManager() {
  return React.useContext(Context)
}
