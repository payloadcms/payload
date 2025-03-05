'use client'
import type { FormState } from 'payload'

import { useDocumentInfo, useServerFunctions } from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useRef } from 'react'

import type { WrapperBlockFields } from '../../../../WrapperBlockNode.js'

export type Props = {
  onReceiveRenderedFields: (args: { state: FormState }) => void
  schemaFieldsPath: null | string
}
export const useLexicalFormState = (
  props: Props,
): {
  initialState?: FormState
  loadInitialState: (args: {
    formData: { text: string } & WrapperBlockFields
    schemaFieldsPath: string
  }) => void
  onFormChange: (args: { formState: FormState; submit?: boolean }) => Promise<FormState>
} => {
  const { onReceiveRenderedFields, schemaFieldsPath } = props
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()
  const { getFormState } = useServerFunctions()
  const [initialState, setInitialState] = React.useState<FormState | undefined>(undefined)

  const loadInitialState = useCallback(
    ({
      formData,
      schemaFieldsPath: schemaFieldsPathFromProps,
    }: {
      formData: { text: string } & WrapperBlockFields
      schemaFieldsPath?: string
    }) => {
      const schemaPath = schemaFieldsPathFromProps ?? schemaFieldsPath
      if (!schemaPath) {
        return
      }
      const abortController = new AbortController()

      const awaitInitialState = async () => {
        /*
         * This will only run if a new block is created. For all existing blocks that are loaded when the document is loaded, or when the form is saved,
         * this is not run, as the lexical field RSC will fetch the state server-side and pass it to the client. That way, we avoid unnecessary client-side
         * requests. Though for newly created blocks, we need to fetch the state client-side, as the server doesn't know about the block yet.
         */
        const { state } = await getFormState({
          id,
          collectionSlug,
          data: formData,
          docPermissions: { fields: true },
          docPreferences: await getDocPreferences(),
          globalSlug,
          operation: 'update',
          renderAllFields: true,
          schemaPath,
          signal: abortController.signal,
        })

        if (state) {
          setInitialState(state)
          if (onReceiveRenderedFields) {
            onReceiveRenderedFields({ state })
          }
        }
      }

      setInitialState(undefined)
      if (formData) {
        void awaitInitialState()
      }
    },
    [
      getFormState,
      id,
      collectionSlug,
      getDocPreferences,
      globalSlug,
      schemaFieldsPath,
      onReceiveRenderedFields,
    ],
  )

  /**
   * Handle drawer and form state
   */
  const onChangeAbortControllerRef = useRef(new AbortController())

  /**
   * HANDLE ONCHANGE
   */
  const onFormChange = useCallback(
    async ({ formState: prevFormState, submit }: { formState: FormState; submit?: boolean }) => {
      if (schemaFieldsPath === null) {
        return prevFormState
      }
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const { state } = await getFormState({
        id,
        collectionSlug,
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        formState: prevFormState,
        globalSlug,
        operation: 'update',
        renderAllFields: submit ? true : false,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      if (!state) {
        return prevFormState
      }

      if (submit) {
        if (onReceiveRenderedFields) {
          onReceiveRenderedFields({ state })
        }
      }

      return state
    },
    [
      getFormState,
      id,
      collectionSlug,
      getDocPreferences,
      globalSlug,
      schemaFieldsPath,
      onReceiveRenderedFields,
    ],
  )
  // cleanup effect
  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [])

  return {
    initialState,
    loadInitialState,
    onFormChange,
  }
}
