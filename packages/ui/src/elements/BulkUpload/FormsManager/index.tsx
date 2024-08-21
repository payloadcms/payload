'use client'

import type { Data, DocumentPermissions, FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { BulkUploadProps } from '../index.js'
import type { State } from './reducer.js'

import { fieldReducer } from '../../../forms/Form/fieldReducer.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { getFormState } from '../../../utilities/getFormState.js'
import { hasSavePermission as getHasSavePermission } from '../../../utilities/hasSavePermission.js'
import { useLoadingOverlay } from '../../LoadingOverlay/index.js'
import { drawerSlug } from '../index.js'
import { createFormData } from './createFormData.js'
import { formsManagementReducer } from './reducer.js'

type FormsManagerContext = {
  readonly activeIndex: State['activeIndex']
  readonly addFiles: (filelist: FileList) => void
  readonly collectionSlug: string
  readonly docPermissions?: DocumentPermissions
  readonly forms: State['forms']
  getFormDataRef: React.RefObject<() => Data>
  readonly hasPublishPermission: boolean
  readonly hasSavePermission: boolean
  readonly hasSubmitted: boolean
  readonly isLoadingFiles: boolean
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
  readonly totalErrorCount?: number
}

const Context = React.createContext<FormsManagerContext>({
  activeIndex: 0,
  addFiles: () => {},
  collectionSlug: '',
  docPermissions: undefined,
  forms: [],
  getFormDataRef: { current: () => ({}) },
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isLoadingFiles: true,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  totalErrorCount: 0,
})

const initialState: State = {
  activeIndex: 0,
  forms: [],
  totalErrorCount: 0,
}

type Props = {
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly onSuccess: BulkUploadProps['onSuccess']
}

export function FormsManagerProvider({ children, collectionSlug, onSuccess }: Props) {
  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config
  const { code } = useLocale()
  const { closeModal } = useModal()
  const { i18n, t } = useTranslation()

  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [docPermissions, setDocPermissions] = React.useState<DocumentPermissions>()
  const [hasSavePermission, setHasSavePermission] = React.useState(false)
  const [hasPublishPermission, setHasPublishPermission] = React.useState(false)
  const [state, dispatch] = React.useReducer(formsManagementReducer, initialState)
  const { activeIndex, forms, totalErrorCount } = state
  const { toggleLoadingOverlay } = useLoadingOverlay()

  const initialStateRef = React.useRef<FormState>(null)
  const hasFetchedInitialFormState = React.useRef(false)
  const getFormDataRef = React.useRef<() => Data>(() => ({}))
  const initialFormStateAbortControllerRef = React.useRef<AbortController>(null)
  const hasFetchedInitialDocPermissions = React.useRef(false)
  const initialDocPermissionsAbortControllerRef = React.useRef<AbortController>(null)

  const actionURL = `${api}/${collectionSlug}`

  const initilizeSharedDocPermissions = React.useCallback(async () => {
    if (initialDocPermissionsAbortControllerRef.current)
      initialDocPermissionsAbortControllerRef.current.abort(
        'aborting previous fetch for initial doc permissions',
      )
    initialDocPermissionsAbortControllerRef.current = new AbortController()

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
      signal: initialDocPermissionsAbortControllerRef.current.signal,
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
  }, [api, code, collectionSlug, i18n.language, serverURL])

  const initializeSharedFormState = React.useCallback(async () => {
    if (initialFormStateAbortControllerRef.current)
      initialFormStateAbortControllerRef.current.abort(
        'aborting previous fetch for initial form state without files',
      )
    initialFormStateAbortControllerRef.current = new AbortController()

    try {
      const formStateWithoutFiles = await getFormState({
        apiRoute: config.routes.api,
        body: {
          collectionSlug,
          locale: code,
          operation: 'create',
          schemaPath: collectionSlug,
        },
        // onError: onLoadError,
        serverURL: config.serverURL,
        signal: initialFormStateAbortControllerRef.current.signal,
      })
      initialStateRef.current = formStateWithoutFiles
      hasFetchedInitialFormState.current = true
    } catch (error) {
      // swallow error
    }
  }, [code, collectionSlug, config.routes.api, config.serverURL])

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

  const addFiles = React.useCallback((files: FileList) => {
    setIsLoadingFiles(true)
    dispatch({ type: 'ADD_FORMS', files, initialState: initialStateRef.current })
    setIsLoadingFiles(false)
  }, [])

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

        if (errorCount === 0) {
          closeModal(drawerSlug)
        }

        if (typeof onSuccess === 'function') {
          onSuccess()
        }
      }

      if (errorCount) {
        toast.error(`Failed to save ${errorCount} files`)
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
    [actionURL, activeIndex, closeModal, forms, onSuccess],
  )

  React.useEffect(() => {
    if (!hasFetchedInitialFormState.current) {
      void initializeSharedFormState()
    }
    if (!hasFetchedInitialDocPermissions.current) {
      void initilizeSharedDocPermissions()
    }
    return
  }, [initializeSharedFormState, initilizeSharedDocPermissions])

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
        isLoadingFiles,
        removeFile,
        saveAllDocs,
        setActiveIndex,
        setFormTotalErrorCount,
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
