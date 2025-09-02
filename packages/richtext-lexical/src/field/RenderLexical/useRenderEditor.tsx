'use client'
import {
  FieldContext,
  FieldPathContext,
  type FieldType,
  type RenderFieldServerFnArgs,
  ServerFunctionsContext,
  type ServerFunctionsContextType,
  useServerFunctions,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'

/**
 * @experimental - may break in minor releases
 */
export const useRenderEditor_internal_ = (args: Omit<RenderFieldServerFnArgs, 'initialValue'>) => {
  const { field, path, schemaPath } = args
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const serverFunctionContext = useServerFunctions()
  const { _internal_renderField } = serverFunctionContext

  const [entityType, entitySlug] = schemaPath.split('.')

  const fieldPath = path ?? (field && 'name' in field ? field?.name : '') ?? ''

  const renderLexical = useCallback(
    (args?: Pick<RenderFieldServerFnArgs, 'initialValue'>) => {
      async function render() {
        const { Field } = await _internal_renderField({
          field,
          initialValue: args?.initialValue ?? undefined,
          path,
          schemaPath,
        })

        setComponent(Field)
      }
      void render()
    },
    [_internal_renderField, schemaPath, path, field],
  )

  const WrappedComponent = React.useMemo(() => {
    function Memoized({
      setValue,
      value,
    }: /**
     * If value or setValue, or both, is provided, this component will manage its own value.
     * If neither is passed, it will rely on the parent form to manage the value.
     */
    {
      setValue?: FieldType<DefaultTypedEditorState | undefined>['setValue']

      value?: FieldType<DefaultTypedEditorState | undefined>['value']
    }) {
      if (!Component) {
        return null
      }

      /**
       * By default, the lexical will make form state requests (e.g. to get drawer fields), passing in the arguments
       * of the current field. However, we need to override those arguments to get it to make requests based on the
       * *target* field. The server only knows the schema map of the target field.
       */
      const adjustedServerFunctionContext: ServerFunctionsContextType = {
        ...serverFunctionContext,
        getFormState: async (getFormStateArgs) => {
          return serverFunctionContext.getFormState({
            ...getFormStateArgs,
            collectionSlug: entityType === 'collection' ? entitySlug : undefined,
            globalSlug: entityType === 'global' ? entitySlug : undefined,
          })
        },
      }

      if (typeof value === 'undefined' && !setValue) {
        return (
          <ServerFunctionsContext value={{ ...adjustedServerFunctionContext }}>
            <FieldPathContext key={fieldPath} value={fieldPath}>
              {Component}
            </FieldPathContext>
          </ServerFunctionsContext>
        )
      }

      const fieldValue: FieldType<DefaultTypedEditorState | undefined> = {
        disabled: false,
        formInitializing: false,
        formProcessing: false,
        formSubmitted: false,
        initialValue: value,
        path: fieldPath,
        setValue: setValue ?? (() => undefined),
        showError: false,
        value,
      }

      return (
        <ServerFunctionsContext value={{ ...adjustedServerFunctionContext }}>
          <FieldPathContext key={fieldPath} value={fieldPath}>
            <FieldContext value={fieldValue}>{Component}</FieldContext>
          </FieldPathContext>
        </ServerFunctionsContext>
      )
    }

    return Memoized
  }, [Component, serverFunctionContext, fieldPath, entityType, entitySlug])

  return { Component: WrappedComponent, renderLexical }
}
