'use client'

import type { ValidationFieldError, ValidationResult } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { ValidationResultsDrawer } from '../../elements/ValidationResultsDrawer/index.js'
import { useForm, useFormFields } from '../../forms/Form/context.js'
import {
  getPublishValidationLocales,
  getValidationEndpoint,
  validateDocumentLocales,
} from '../../utilities/documentValidation.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import { useConfig } from '../Config/index.js'
import { useDocumentInfo } from '../DocumentInfo/index.js'
import { useLocale } from '../Locale/index.js'

type DocumentValidationContext = {
  isValidating: boolean
  validateAllLocales: () => Promise<boolean>
  validateBeforePublish: (args: { isPublishAll: boolean }) => Promise<boolean>
}

const Context = createContext<DocumentValidationContext>({
  isValidating: false,
  validateAllLocales: () => Promise.resolve(true),
  validateBeforePublish: () => Promise.resolve(true),
})

export const useDocumentValidation = (): DocumentValidationContext => use(Context)

export const DocumentValidationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    config: {
      blocksMap,
      localization,
      routes: { api },
    },
  } = useConfig()
  const { id, collectionSlug, docConfig, globalSlug } = useDocumentInfo()
  const { code: activeLocale } = useLocale()
  const { getData } = useForm()
  const formState = useFormFields(([fields]) => fields)
  const { closeModal, openModal } = useModal()

  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<null | ValidationResult>(null)
  const activeRequestRef = useRef<AbortController>(null)
  const validResultTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const drawerID = useId()
  const drawerSlug = useMemo(
    () => `document-validation-results-${drawerID.replaceAll(':', '')}`,
    [drawerID],
  )

  const fields = useMemo(() => docConfig?.fields ?? [], [docConfig?.fields])
  const hasLocalizedFields = useMemo(() => traverseForLocalizedFields(fields), [fields])
  const targetKey = `${collectionSlug ?? ''}:${globalSlug ?? ''}:${id ?? 'create'}`

  const clearResult = useCallback(() => {
    activeRequestRef.current?.abort()
    activeRequestRef.current = null

    if (validResultTimeoutRef.current) {
      clearTimeout(validResultTimeoutRef.current)
      validResultTimeoutRef.current = null
    }

    setIsValidating(false)
    setResult(null)
    closeModal(drawerSlug)
  }, [closeModal, drawerSlug])

  useEffect(() => {
    clearResult()
  }, [activeLocale, clearResult, formState, targetKey])

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort()

      if (validResultTimeoutRef.current) {
        clearTimeout(validResultTimeoutRef.current)
      }
    }
  }, [])

  const runValidation = useCallback(
    async ({
      isPublishing,
      locales,
      showValidResult,
    }: {
      isPublishing: boolean
      locales: string[]
      showValidResult: boolean
    }): Promise<boolean> => {
      if (!localization || !hasLocalizedFields) {
        return true
      }

      activeRequestRef.current?.abort()

      if (validResultTimeoutRef.current) {
        clearTimeout(validResultTimeoutRef.current)
        validResultTimeoutRef.current = null
      }

      const abortController = new AbortController()
      activeRequestRef.current = abortController
      setIsValidating(true)

      try {
        const data = {
          ...getData(),
          ...(isPublishing ? { _status: 'published' } : {}),
        }
        const validationResult = await validateDocumentLocales({
          activeLocale,
          blocksMap,
          data,
          endpoint: getValidationEndpoint({
            id,
            apiRoute: api,
            collectionSlug,
            globalSlug,
          }),
          fields,
          locales,
          signal: abortController.signal,
        })

        if (abortController.signal.aborted) {
          return false
        }

        if (!validationResult.valid || showValidResult) {
          setResult(validationResult)
          openModal(drawerSlug)
        }

        if (validationResult.valid && showValidResult) {
          validResultTimeoutRef.current = setTimeout(() => {
            setResult(null)
            closeModal(drawerSlug)
          }, 4000)
        }

        return validationResult.valid
      } catch (error) {
        if (abortController.signal.aborted) {
          return false
        }

        const validationError: ValidationFieldError = {
          locale: activeLocale,
          message: error instanceof Error ? error.message : String(error),
          path: '',
        }
        const validationResult = {
          errors: [validationError],
          valid: false,
        }

        setResult(validationResult)
        openModal(drawerSlug)

        return false
      } finally {
        if (activeRequestRef.current === abortController) {
          activeRequestRef.current = null
          setIsValidating(false)
        }
      }
    },
    [
      activeLocale,
      api,
      blocksMap,
      collectionSlug,
      fields,
      getData,
      globalSlug,
      hasLocalizedFields,
      id,
      localization,
      openModal,
      closeModal,
      drawerSlug,
    ],
  )

  const validateAllLocales = useCallback(() => {
    if (!localization) {
      return Promise.resolve(true)
    }

    return runValidation({
      isPublishing: false,
      locales: localization.locales.map(({ code }) => code),
      showValidResult: true,
    })
  }, [localization, runValidation])

  const validateBeforePublish = useCallback(
    ({ isPublishAll }: { isPublishAll: boolean }) => {
      if (!localization) {
        return Promise.resolve(true)
      }

      return runValidation({
        isPublishing: true,
        locales: getPublishValidationLocales({
          activeLocale,
          isPublishAll,
          locales: localization.locales,
        }),
        showValidResult: false,
      })
    },
    [activeLocale, localization, runValidation],
  )

  const value = useMemo(
    () => ({
      isValidating,
      validateAllLocales,
      validateBeforePublish,
    }),
    [isValidating, validateAllLocales, validateBeforePublish],
  )

  return (
    <Context value={value}>
      {children}
      <ValidationResultsDrawer
        activeLocale={activeLocale}
        locales={localization ? localization.locales : []}
        result={result}
        slug={drawerSlug}
      />
    </Context>
  )
}
