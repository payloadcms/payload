'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { useRouter } from 'next/navigation.js'
import { serialize } from 'object-to-formdata'
import { type ComponentSlot, type FormState, type PayloadRequest } from 'payload'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  hasDraftValidationEnabled,
  parsePayloadComponent,
  reduceFieldsToValues,
  wait,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  CreateFormData,
  Context as FormContextType,
  FormProps,
  GetDataByPath,
  RenderedFieldsResult,
  Submit,
  SubmitOptions,
} from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useQueue } from '../../hooks/useQueue.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { AdminValidateErrorsProvider } from '../../providers/AdminValidateErrors/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useOptionalClientImportRegistry } from '../../providers/ClientImportRegistry/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import {
  createPendingServerFieldPaths,
  PendingServerFieldPathsProvider,
} from '../../providers/PendingServerFieldPaths/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadHandlers } from '../../providers/UploadHandlers/index.js'
import { VisibilityMapProvider } from '../../providers/VisibilityMap/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { requests } from '../../utilities/api.js'
import { findClientFieldAtPath } from '../../utilities/findClientFieldAtPath.js'
import {
  BackgroundProcessingContext,
  DocumentFormContext,
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  InitializingContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useDocumentForm,
} from './context.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'
import { useClientAdminValidateErrors } from './useClientAdminValidateErrors.js'
import { useClientConditionVisibility } from './useClientConditionVisibility.js'

const baseClass = 'form'

type AdminPathRef = { fieldPath: string; ref: unknown }

/**
 * Strip the entity slug prefix (e.g. `posts.`) from each ref's fieldPath so
 * the resulting keys match formState's field-relative paths.
 * `componentIndex` / `importMaps` carry collection-prefixed paths; formState
 * (and thus WatchCondition's lookup key) does not.
 */
function stripEntitySlugPrefix<T extends AdminPathRef>(
  refs: T[] | undefined,
  entitySlug: string | undefined,
): T[] | undefined {
  if (!refs || !entitySlug) {
    return refs
  }
  const prefix = `${entitySlug}.`
  return refs.map((entry) =>
    entry.fieldPath.startsWith(prefix)
      ? { ...entry, fieldPath: entry.fieldPath.slice(prefix.length) }
      : entry,
  )
}

export const Form: React.FC<FormProps> = (props) => {
  const { id, collectionSlug, docConfig, docPermissions, getDocPreferences, globalSlug } =
    useDocumentInfo()

  const validateDrafts = hasDraftValidationEnabled(docConfig)

  const {
    action,
    beforeSubmit,
    children,
    className,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    el,
    handleResponse,
    initialState, // fully formed initial field state
    isDocumentForm,
    isInitializing: initializingFromProps,
    onChange,
    onSubmit,
    onSuccess,
    redirect,
    submitted: submittedFromProps,
    uuid,
    waitForAutocomplete,
  } = props

  const method = 'method' in props ? props?.method : undefined

  const router = useRouter()

  const documentForm = useDocumentForm()

  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { refreshCookie, user } = useAuth()
  const operation = useOperation()
  const { queueTask } = useQueue()

  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()

  const [disabled, setDisabled] = useState(disabledFromProps || false)
  const [isMounted, setIsMounted] = useState(false)

  const [submitted, setSubmitted] = useState(false)

  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  const [isValid, setIsValid] = useState(true)
  const [initializing, setInitializing] = useState(initializingFromProps)

  const [processing, setProcessing] = useState(false)

  /**
   * Determines whether the form is processing asynchronously in the background, e.g. autosave is running.
   * Useful to determine whether to disable the form or queue other processes while in flight, e.g. disable manual submits while an autosave is running.
   */
  const [backgroundProcessing, _setBackgroundProcessing] = useState(false)

  /**
   * A ref that can be read within the `setModified` interceptor.
   * Dependents of this state can read it immediately without needing to wait for a render cycle.
   */
  const backgroundProcessingRef = useRef(backgroundProcessing)

  /**
   * Flag to track if the form was modified _during a submission_, e.g. while autosave is running.
   * Useful in order to avoid resetting `modified` to false wrongfully after a submit.
   * For example, if the user modifies a field while the a background process (autosave) is running,
   * we need to ensure that after the submit completes, the `modified` state remains true.
   */
  const modifiedWhileProcessingRef = useRef(false)

  /**
   * Intercept the `setBackgroundProcessing` method to keep the ref in sync.
   * See the `backgroundProcessingRef` for more details.
   */
  const setBackgroundProcessing = useCallback((backgroundProcessing: boolean) => {
    backgroundProcessingRef.current = backgroundProcessing
    _setBackgroundProcessing(backgroundProcessing)
  }, [])

  const [modified, _setModified] = useState(false)

  /**
   * Intercept the `setModified` method to track whether the event happened during background processing.
   * See the `modifiedWhileProcessingRef` ref for more details.
   */
  const setModified = useCallback((modified: boolean) => {
    if (backgroundProcessingRef.current) {
      modifiedWhileProcessingRef.current = true
    }

    _setModified(modified)
  }, [])

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const abortResetFormRef = useRef<AbortController>(null)
  const isFirstRenderRef = useRef(true)

  const fieldsReducer = useReducer(fieldReducer, {}, () => initialState)

  const [formState, dispatchFields] = fieldsReducer

  contextRef.current.fields = formState

  const prevFormState = useRef(formState)
  const prevVisibilityMapRef = useRef<Map<string, boolean>>(new Map())

  // Phase 5.4b/Phase 6: client-side condition pipeline. Pre-resolves
  // admin.condition refs via the client registry on mount, then recomputes
  // a visibility map on every formState change. Hoisted above
  // `executeOnChange` so the map can be forwarded to onChange callbacks
  // (Phase 6 dispatch swap consumes it). Inline conditions are filtered
  // server-side so they never appear in `refs`.
  const importRegistry = useOptionalClientImportRegistry()
  // Phase 8: strip the entity-slug prefix from each ref's fieldPath so
  // visibility-map keys match formState keys (formState is keyed by
  // field-relative paths, e.g. `advancedNote`, while
  // `componentIndex` / `importMaps` carry full paths
  // `posts.advancedNote`). Same for admin.validate refs below.
  const entitySlug = collectionSlug || globalSlug
  const conditionRefs = useMemo(
    () => stripEntitySlugPrefix(config?.adminConditionRefs, entitySlug),
    [config?.adminConditionRefs, entitySlug],
  )

  /**
   * Phase 14: wildcard-aware matcher for every slug-stripped server-Field
   * path in the form. RenderField consumes this through
   * `useOptionalPendingServerFieldPaths` so it can render a shimmer (rather
   * than the default field) for paths whose server custom Field hasn't
   * landed yet — both at first reveal via condition flip and during the
   * brief window between ADD_ROW and the renderFields response.
   */
  const pendingServerFieldPaths = useMemo(() => {
    const refs = config?.componentRefs ?? []
    const slugPrefix = entitySlug ? `${entitySlug}.` : ''
    const patterns: string[] = []
    for (const ref of refs) {
      if (ref.kind !== 'server' || ref.slot !== 'Field') {
        continue
      }
      const stripped =
        slugPrefix && ref.path.startsWith(slugPrefix) ? ref.path.slice(slugPrefix.length) : ref.path
      patterns.push(stripped)
    }
    return createPendingServerFieldPaths(patterns)
  }, [config?.componentRefs, entitySlug])

  /**
   * Phase 13.x: derive client-Field array entries — for each array container
   * whose row schema has at least one client-classified custom Field, list the
   * sub-paths and their import-map keys. `addFieldRow` consults this to mount
   * client custom Field components synchronously on ADD_ROW (no default-Field
   * flash, no shimmer). The componentPath is parsed once per ref so the
   * dispatch lookup stays cheap. Slug-stripped to align with formState paths.
   */
  type ClientFieldArrayEntry = {
    componentPath: string
    parsedKey: string
    subPath: string
  }
  const clientFieldArrayEntries = useMemo(() => {
    const result = new Map<string, ClientFieldArrayEntry[]>()
    const refs = config?.componentRefs ?? []
    const slugPrefix = entitySlug ? `${entitySlug}.` : ''
    for (const ref of refs) {
      if (ref.kind !== 'client' || ref.slot !== 'Field') {
        continue
      }
      const stripped =
        slugPrefix && ref.path.startsWith(slugPrefix) ? ref.path.slice(slugPrefix.length) : ref.path
      const wildcardIdx = stripped.indexOf('.*.')
      if (wildcardIdx === -1) {
        continue
      }
      const arrayPath = stripped.slice(0, wildcardIdx)
      const subPath = stripped.slice(wildcardIdx + 3)
      const parsed = parsePayloadComponent(ref.componentPath)
      if (!parsed) {
        continue
      }
      const parsedKey = `${parsed.path}#${parsed.exportName}`
      if (!result.has(arrayPath)) {
        result.set(arrayPath, [])
      }
      result.get(arrayPath).push({ componentPath: ref.componentPath, parsedKey, subPath })
    }
    return result
  }, [config?.componentRefs, entitySlug])

  // Pre-warm the client import registry for every client-Field component
  // referenced in this form. By the time the user clicks Add Row, the
  // module's resolved value is already in the registry's value cache and
  // `addFieldRow` can read it via `getCached` without an async hop.
  useEffect(() => {
    if (!importRegistry || clientFieldArrayEntries.size === 0) {
      return
    }
    const seen = new Set<string>()
    for (const entries of clientFieldArrayEntries.values()) {
      for (const entry of entries) {
        if (seen.has(entry.parsedKey) || !importRegistry.has(entry.parsedKey)) {
          continue
        }
        seen.add(entry.parsedKey)
        // Fire-and-forget: errors here just leave the entry missing from
        // the cache, which falls back to the existing async resolve path.
        void importRegistry.resolve(entry.parsedKey).catch(() => {})
      }
    }
  }, [importRegistry, clientFieldArrayEntries])
  const validateRefs = useMemo(
    () => stripEntitySlugPrefix(config?.adminValidateRefs, entitySlug),
    [config?.adminValidateRefs, entitySlug],
  )
  const formData = useMemo(
    () => reduceFieldsToValues(formState, true) as Record<string, unknown>,
    [formState],
  )
  const visibilityMap = useClientConditionVisibility({
    data: formData,
    formState,
    operation,
    refs: conditionRefs,
    registry: importRegistry,
    user,
  })

  const validateForm = useCallback(async () => {
    const validatedFieldState = {}
    let isValid = true

    const data = contextRef.current.getData()

    const validationPromises = Object.entries(contextRef.current.fields).map(
      async ([path, field]) => {
        const validatedField = field
        const pathSegments = path ? path.split('.') : []

        if (field.passesCondition !== false) {
          let validationResult: boolean | string = validatedField.valid

          if ('validate' in field && typeof field.validate === 'function') {
            let valueToValidate = field.value

            if (field?.rows && Array.isArray(field.rows)) {
              valueToValidate = contextRef.current.getDataByPath(path)
            }

            validationResult = await field.validate(valueToValidate, {
              ...field,
              id,
              collectionSlug,
              // If there is a parent document form, we can get the data from that form
              blockData: undefined, // Will be expensive to get - not worth to pass to client-side validation, as this can be obtained by the user using `useFormFields()`
              data: documentForm?.getData ? documentForm.getData() : data,
              event: 'submit',
              operation,
              path: pathSegments,
              preferences: {} as any,
              req: {
                payload: {
                  config,
                },
                t,
                user,
              } as unknown as PayloadRequest,
              siblingData: contextRef.current.getSiblingData(path),
            })

            if (typeof validationResult === 'string') {
              validatedField.errorMessage = validationResult
              validatedField.valid = false
            } else {
              validatedField.valid = true
              validatedField.errorMessage = undefined
            }
          }

          if (validatedField.valid === false) {
            isValid = false
          }
        }

        validatedFieldState[path] = validatedField
      },
    )

    await Promise.all(validationPromises)

    if (!dequal(contextRef.current.fields, validatedFieldState)) {
      dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState })
    }

    setIsValid(isValid)

    return isValid
  }, [collectionSlug, config, dispatchFields, id, operation, t, user, documentForm])

  const submit = useCallback<Submit>(
    async (options, e) => {
      const {
        acceptValues = true,
        action: actionArg = action,
        context,
        disableFormWhileProcessing = true,
        disableSuccessStatus: disableSuccessStatusFromArgs,
        method: methodToUse = method,
        overrides: overridesFromArgs = {},
        skipValidation,
      } = options || ({} as SubmitOptions)

      const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus

      if (disabled) {
        if (e) {
          e.preventDefault()
        }
        return
      }

      // create new toast promise which will resolve manually later
      let errorToast, successToast

      const promise = new Promise((resolve, reject) => {
        successToast = resolve
        errorToast = reject
      })

      const hasFormSubmitAction =
        actionArg || typeof action === 'string' || typeof action === 'function'

      if (redirect || disableToast || !hasFormSubmitAction) {
        // Do not show submitting toast, as the promise toast may never disappear under these conditions.
        // Instead, make successToast() or errorToast() throw toast.success / toast.error
        successToast = (data) => toast.success(data)
        errorToast = (data) => toast.error(data)
      } else {
        toast.promise(promise, {
          error: (data) => {
            return data as string
          },
          loading: t('general:submitting'),
          success: (data) => {
            return data as string
          },
        })
      }

      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }

      if (disableFormWhileProcessing) {
        setProcessing(true)
        setDisabled(true)
      }

      if (waitForAutocomplete) {
        await wait(100)
      }

      const data = reduceFieldsToValues(contextRef.current.fields, true)

      const serializableFormState = deepCopyObjectSimpleWithoutReactComponents(
        contextRef.current.fields,
        {
          excludeFiles: true,
        },
      )

      // Execute server side validations
      if (Array.isArray(beforeSubmit)) {
        let revalidatedFormState: FormState

        await beforeSubmit.reduce(async (priorOnChange, beforeSubmitFn) => {
          await priorOnChange

          const result = await beforeSubmitFn({
            formState: serializableFormState,
          })

          revalidatedFormState = result
        }, Promise.resolve())

        const isValid = Object.entries(revalidatedFormState).every(
          ([, field]) => field.valid !== false,
        )

        setIsValid(isValid)

        if (!isValid) {
          setProcessing(false)
          setSubmitted(true)
          setDisabled(false)
          return dispatchFields({ type: 'REPLACE_STATE', state: revalidatedFormState })
        }
      }

      const isValid =
        skipValidation || disableValidationOnSubmit ? true : await contextRef.current.validateForm()

      setIsValid(isValid)

      // If not valid, prevent submission
      if (!isValid) {
        errorToast(t('error:correctInvalidFields'))
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      let overrides = {}

      if (typeof overridesFromArgs === 'function') {
        overrides = overridesFromArgs(contextRef.current.fields)
      } else if (typeof overridesFromArgs === 'object') {
        overrides = overridesFromArgs
      }

      // If submit handler comes through via props, run that
      if (onSubmit) {
        for (const [key, value] of Object.entries(overrides)) {
          data[key] = value
        }

        onSubmit(contextRef.current.fields, data)
      }

      if (!hasFormSubmitAction) {
        // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
        // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      try {
        const formData = await contextRef.current.createFormData(overrides, {
          data,
          mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
        })

        let res

        if (typeof actionArg === 'string') {
          res = await requests[methodToUse.toLowerCase()](actionArg, {
            body: formData,
            headers: {
              'Accept-Language': i18n.language,
            },
          })
        } else if (typeof action === 'function') {
          res = await action(formData)
        }

        if (!modifiedWhileProcessingRef.current) {
          setModified(false)
        } else {
          modifiedWhileProcessingRef.current = false
        }

        setDisabled(false)

        if (typeof handleResponse === 'function') {
          handleResponse(res, successToast, errorToast)
          return
        }

        const contentType = res.headers.get('content-type')
        const isJSON = contentType && contentType.indexOf('application/json') !== -1

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let json: Record<string, any> = {}

        if (isJSON) {
          json = await res.json()
        }

        if (res.status < 400) {
          if (typeof onSuccess === 'function') {
            const newFormState = await onSuccess(json, {
              context,
              formState: serializableFormState,
            })

            if (newFormState) {
              dispatchFields({
                type: 'MERGE_SERVER_STATE',
                acceptValues,
                prevStateRef: prevFormState,
                serverState: newFormState,
              })
            }
          }

          setSubmitted(false)
          setProcessing(false)

          if (redirect) {
            startRouteTransition(() => router.push(redirect))
          } else if (!disableToast) {
            successToast(json.message || t('general:submissionSuccessful'))
          }
        } else {
          setProcessing(false)
          setSubmitted(true)

          // When there was an error submitting a draft,
          // set the form state to unsubmitted, to not trigger visible form validation on changes after the failed submit.
          // Also keep the form as modified so the save button remains enabled for retry.
          if (overridesFromArgs['_status'] === 'draft') {
            setModified(true)

            if (!validateDrafts) {
              setSubmitted(false)
            }
          }

          contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form

          if (json.message) {
            errorToast(json.message)
            return
          }

          if (Array.isArray(json.errors)) {
            const [fieldErrors, nonFieldErrors] = json.errors.reduce(
              ([fieldErrs, nonFieldErrs], err) => {
                const newFieldErrs = []
                const newNonFieldErrs = []

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

            setIsValid(false)

            dispatchFields({
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            })

            nonFieldErrors.forEach((err) => {
              errorToast(<FieldErrorsToast errorMessage={err.message || t('error:unknown')} />)
            })

            return
          }

          const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown')

          errorToast(message)
        }

        return { formState: contextRef.current.fields, res }
      } catch (err) {
        console.error('Error submitting form', err) // eslint-disable-line no-console
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        errorToast(err.message)
      }
    },
    [
      beforeSubmit,
      startRouteTransition,
      action,
      disableSuccessStatus,
      disableValidationOnSubmit,
      disabled,
      dispatchFields,
      handleResponse,
      method,
      onSubmit,
      onSuccess,
      redirect,
      router,
      t,
      i18n,
      validateDrafts,
      waitForAutocomplete,
      setModified,
      setSubmitted,
    ],
  )

  const getFields = useCallback(() => contextRef.current.fields, [])

  const getField = useCallback((path: string) => contextRef.current.fields[path], [])

  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [])

  const getSiblingData = useCallback(
    (path: string) => getSiblingDataFunc(contextRef.current.fields, path),
    [],
  )

  const getDataByPath = useCallback<GetDataByPath>(
    (path: string) => getDataByPathFunc(contextRef.current.fields, path),
    [],
  )

  const createFormData = useCallback<CreateFormData>(
    async (overrides, { data: dataFromArgs, mergeOverrideData = true }) => {
      let data = dataFromArgs || reduceFieldsToValues(contextRef.current.fields, true)

      let file = data?.file

      if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
        delete data.file

        const handler = getUploadHandler({ collectionSlug })

        if (typeof handler === 'function') {
          let filename = file.name
          const clientUploadContext = await handler({
            docPrefix: typeof data?.prefix === 'string' ? data.prefix : undefined,
            file,
            updateFilename: (value) => {
              filename = value
            },
          })

          file = JSON.stringify({
            clientUploadContext,
            collectionSlug,
            filename,
            mimeType: file.type,
            size: file.size,
          })
        }
      }

      if (mergeOverrideData) {
        data = {
          ...data,
          ...overrides,
        }
      } else {
        data = overrides
      }

      const dataToSerialize: Record<string, unknown> = {
        _payload: JSON.stringify(data),
      }

      if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
        dataToSerialize.file = file
      }

      // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
      const formData = serialize(dataToSerialize, {
        indices: true,
        nullsAsUndefineds: false,
      })

      return formData
    },
    [collectionSlug, docConfig, getUploadHandler],
  )

  const reset = useCallback(
    async (data: unknown) => {
      const controller = handleAbortRef(abortResetFormRef)

      const docPreferences = await getDocPreferences()

      const { state: newState } = await getFormState({
        id,
        collectionSlug,
        data,
        docPermissions,
        docPreferences,
        globalSlug,
        locale,
        operation,
        renderAllFields: true,
        schemaPath: collectionSlug ? collectionSlug : globalSlug,
        signal: controller.signal,
        skipValidation: true,
      })

      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })

      abortResetFormRef.current = null
    },
    [
      collectionSlug,
      dispatchFields,
      globalSlug,
      id,
      operation,
      getFormState,
      docPermissions,
      getDocPreferences,
      locale,
      setModified,
    ],
  )

  const replaceState = useCallback(
    (state: FormState) => {
      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields, setModified],
  )

  const addFieldRow: FormContextType['addFieldRow'] = useCallback(
    ({ blockType, path, rowIndex: rowIndexArg, subFieldState }) => {
      const newRows: unknown[] = getDataByPath(path) || []
      const rowIndex = rowIndexArg === undefined ? newRows.length : rowIndexArg

      // Phase 13.x: synchronously mount client-classified custom Field
      // components on ADD_ROW so the row paints with the user's component
      // immediately — no default-Field flash, no shimmer (those happen
      // for server-classified Fields where a renderFields roundtrip is
      // unavoidable). Requires the registry to be pre-warmed for the
      // matching componentPath; the Form-mount effect above does that.
      const rowFullPath = `${path}.${rowIndex}`
      const clientCustomComponents: Record<string, { Field: React.ReactNode }> = {}
      const clientEntries = clientFieldArrayEntries.get(path)
      if (clientEntries && importRegistry) {
        for (const entry of clientEntries) {
          const mod = importRegistry.getCached(entry.parsedKey) as null | Record<string, unknown>
          if (!mod) {
            continue
          }
          const parsed = parsePayloadComponent(entry.componentPath)
          if (!parsed) {
            continue
          }
          const candidate = mod[parsed.exportName] ?? mod.default
          if (typeof candidate !== 'function') {
            continue
          }
          const fieldFullPath = `${rowFullPath}.${entry.subPath}`
          const field = findClientFieldAtPath(docConfig, fieldFullPath)
          if (!field) {
            continue
          }
          const Component = candidate as React.ComponentType<{
            field: unknown
            path: string
            schemaPath: string
          }>
          clientCustomComponents[entry.subPath] = {
            Field: <Component field={field} path={fieldFullPath} schemaPath={fieldFullPath} />,
          }
        }
      }

      // dispatch ADD_ROW adds a blank row to local form state.
      // This performs no form state request, as the debounced onChange effect will do that for us.
      dispatchFields({
        type: 'ADD_ROW',
        blockType,
        // Pre-mounted client Field components for this row, keyed by the
        // sub-path relative to the row (e.g. `text` for `array.0.text`).
        // The reducer writes them into the new row's flat field state so
        // the first paint shows the custom component (no swap).
        clientCustomComponents,
        path,
        rowIndex,
        subFieldState,
      })

      setModified(true)
    },
    [
      clientFieldArrayEntries,
      dispatchFields,
      docConfig,
      getDataByPath,
      importRegistry,
      setModified,
    ],
  )

  const moveFieldRow: FormContextType['moveFieldRow'] = useCallback(
    ({ moveFromIndex, moveToIndex, path }) => {
      dispatchFields({
        type: 'MOVE_ROW',
        moveFromIndex,
        moveToIndex,
        path,
      })

      setModified(true)
    },
    [dispatchFields, setModified],
  )

  const removeFieldRow: FormContextType['removeFieldRow'] = useCallback(
    ({ path, rowIndex }) => {
      dispatchFields({ type: 'REMOVE_ROW', path, rowIndex })

      setModified(true)
    },
    [dispatchFields, setModified],
  )

  const replaceFieldRow: FormContextType['replaceFieldRow'] = useCallback(
    ({ blockType, path, rowIndex: rowIndexArg, subFieldState }) => {
      const currentRows: unknown[] = getDataByPath(path)
      const rowIndex = rowIndexArg === undefined ? currentRows.length : rowIndexArg

      dispatchFields({
        type: 'REPLACE_ROW',
        blockType,
        path,
        rowIndex,
        subFieldState,
      })

      setModified(true)
    },
    [dispatchFields, getDataByPath, setModified],
  )

  useEffect(() => {
    const abortOnChange = abortResetFormRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

  useEffect(() => {
    if (initializingFromProps !== undefined) {
      setInitializing(initializingFromProps)
    }
  }, [initializingFromProps])

  contextRef.current.submit = submit
  contextRef.current.getFields = getFields
  contextRef.current.getField = getField
  contextRef.current.getData = getData
  contextRef.current.getSiblingData = getSiblingData
  contextRef.current.getDataByPath = getDataByPath
  contextRef.current.validateForm = validateForm
  contextRef.current.createFormData = createFormData
  contextRef.current.setModified = setModified
  contextRef.current.setProcessing = setProcessing
  contextRef.current.setBackgroundProcessing = setBackgroundProcessing

  contextRef.current.setSubmitted = setSubmitted
  contextRef.current.setIsValid = setIsValid
  contextRef.current.disabled = disabled
  contextRef.current.setDisabled = setDisabled
  contextRef.current.formRef = formRef
  contextRef.current.reset = reset
  contextRef.current.replaceState = replaceState
  contextRef.current.dispatchFields = dispatchFields
  contextRef.current.addFieldRow = addFieldRow
  contextRef.current.removeFieldRow = removeFieldRow
  contextRef.current.moveFieldRow = moveFieldRow
  contextRef.current.replaceFieldRow = replaceFieldRow
  contextRef.current.uuid = uuid
  contextRef.current.initializing = initializing
  contextRef.current.isValid = isValid

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof disabledFromProps === 'boolean') {
      setDisabled(disabledFromProps)
    }
  }, [disabledFromProps])

  useEffect(() => {
    if (typeof submittedFromProps === 'boolean') {
      setSubmitted(submittedFromProps)
    }
  }, [submittedFromProps])

  useEffect(() => {
    if (initialState) {
      contextRef.current = { ...initContextState } as FormContextType
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        sanitize: true,
        state: initialState,
      })
    }
  }, [initialState, dispatchFields])

  useThrottledEffect(
    () => {
      refreshCookie()
    },
    15000,
    [formState],
  )

  const handleLocaleChange = useEffectEvent(() => {
    contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form
    setModified(false)
  })

  useEffect(() => {
    handleLocaleChange()
  }, [locale])

  const classes = [className, baseClass].filter(Boolean).join(' ')

  const executeOnChange = useEffectEvent((submitted: boolean) => {
    // Snapshot visibility maps SYNCHRONOUSLY at queue-push time — Phase 6
    // dispatch (decideCall + renderFields) needs prev/next pairs to detect
    // newly-visible targets. If the previous task is still in-flight, our
    // task body runs later, by which point the refs/closure values have
    // moved on. Capture here so each queued task carries its own snapshot
    // of the transition that triggered it. Backwards-compatible: legacy
    // consumers (BulkUpload, EditMany) ignore these args.
    const prevFormStateSnapshot = prevFormState.current
    const prevVisibilitySnapshot = prevVisibilityMapRef.current
    const visibilitySnapshot = visibilityMap
    const formStateSnapshot = formState

    const dispatchClearRenderedFields: (
      paths: Array<{ path: string; slot: ComponentSlot }>,
    ) => void = (paths) => {
      if (!paths || paths.length === 0) {
        return
      }
      dispatchFields({ type: 'CLEAR_RENDERED_FIELDS', paths })
    }

    queueTask(async () => {
      if (Array.isArray(onChange)) {
        let result: FormState | RenderedFieldsResult | undefined | void

        for (const onChangeFn of onChange) {
          // Edit view default onChange is in packages/ui/src/views/Edit/index.tsx. This onChange usually sends a form state request
          result = await onChangeFn({
            dispatchClearRenderedFields,
            formState: deepCopyObjectSimpleWithoutReactComponents(formStateSnapshot, {
              excludeFiles: true,
            }),
            prevFormState: prevFormStateSnapshot,
            prevVisibility: prevVisibilitySnapshot,
            submitted,
            visibility: visibilitySnapshot,
          })
        }

        if (!result) {
          return
        }

        // Phase 6: discriminate the dispatch shape. The legacy contract
        // returns a `FormState` that is fed through the full
        // mergeServerFormState pipeline. The new dispatch swap returns a
        // sentinel envelope describing rendered components only — written
        // through a narrower reducer action so visibility/validity state
        // is preserved verbatim.
        if (
          typeof result === 'object' &&
          'type' in result &&
          (result as { type: string }).type === 'rendered-fields'
        ) {
          const envelope = result as RenderedFieldsResult
          if (envelope.rendered && envelope.rendered.length > 0) {
            dispatchFields({
              type: 'MERGE_RENDERED_FIELDS',
              rendered: envelope.rendered,
            })
          }
          return
        }

        dispatchFields({
          type: 'MERGE_SERVER_STATE',
          prevStateRef: prevFormState,
          serverState: result as FormState,
        })
      }
    })
  })

  useDebouncedEffect(
    () => {
      if ((isFirstRenderRef.current || !dequal(formState, prevFormState.current)) && modified) {
        executeOnChange(submitted)
      }

      prevFormState.current = formState
      prevVisibilityMapRef.current = visibilityMap
      isFirstRenderRef.current = false
    },
    [modified, submitted, formState, visibilityMap],
    250,
  )

  const DocumentFormContextComponent: React.FC<any> = isDocumentForm
    ? DocumentFormContext
    : React.Fragment

  const documentFormContextProps = isDocumentForm
    ? {
        value: contextRef.current,
      }
    : {}

  const El: 'form' = (el as unknown as 'form') || 'form'

  // Phase 5.4c: parallel client-side validate pipeline. Pre-resolves admin.validate
  // refs via the client registry on mount, then recomputes an error map on every
  // formState change. Mounted as a parallel signal alongside the existing
  // `errorMessage` field-state flow — `validateForm` is unchanged. Phase 5.4e will
  // swap dispatch to consume this map.
  const adminValidateContext = useMemo(
    () => ({
      data: formData,
      operation,
      siblingData: undefined,
      user,
    }),
    [formData, operation, user],
  )
  const adminValidateErrors = useClientAdminValidateErrors({
    context: adminValidateContext,
    formState,
    refs: validateRefs,
    registry: importRegistry,
    values: formData,
  })

  return (
    <El
      action={typeof action === 'function' ? void action : action}
      className={classes}
      /**
       * data-form-ready signals if the form is ready to be used. This is used by our e2e tests
       * to wait for the form to be ready before interacting with it, reducing flakiness if the test is run in
       * slow network conditions.
       */
      data-form-ready={!processing && isMounted && !initializing}
      method={method}
      noValidate
      onSubmit={(e) => void contextRef.current.submit({}, e)}
      ref={formRef}
    >
      <DocumentFormContextComponent {...documentFormContextProps}>
        <FormContext value={contextRef.current}>
          <FormWatchContext
            value={{
              fields: formState,
              ...contextRef.current,
            }}
          >
            <SubmittedContext value={submitted}>
              <InitializingContext value={!isMounted || (isMounted && initializing)}>
                <ProcessingContext value={processing}>
                  <BackgroundProcessingContext value={backgroundProcessing}>
                    <ModifiedContext value={modified}>
                      {/* eslint-disable-next-line @eslint-react/no-context-provider */}
                      <FormFieldsContext.Provider value={fieldsReducer}>
                        <VisibilityMapProvider map={visibilityMap}>
                          <PendingServerFieldPathsProvider patterns={pendingServerFieldPaths}>
                            <AdminValidateErrorsProvider errors={adminValidateErrors}>
                              {children}
                            </AdminValidateErrorsProvider>
                          </PendingServerFieldPathsProvider>
                        </VisibilityMapProvider>
                      </FormFieldsContext.Provider>
                    </ModifiedContext>
                  </BackgroundProcessingContext>
                </ProcessingContext>
              </InitializingContext>
            </SubmittedContext>
          </FormWatchContext>
        </FormContext>
      </DocumentFormContextComponent>
    </El>
  )
}

export {
  DocumentFormContext,
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useAllFormFields,
  useDocumentForm,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from './context.js'

export { FormProps }
