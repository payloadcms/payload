'use client'
import {
  FieldContext,
  type FieldType,
  ServerFunctionsContext,
  type ServerFunctionsContextType,
  useServerFunctions,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'
import type {
  RenderLexicalServerFunctionArgs,
  RenderLexicalServerFunctionReturnType,
} from './renderLexical.js'

/**
 * @experimental - may break in minor releases
 */
export const useRenderEditor_internal_ = (
  args: Omit<RenderLexicalServerFunctionArgs, 'initialValue' | 'schemaPath'>,
) => {
  const { name, admin, editorTarget, path } = args
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const serverFunctionContext = useServerFunctions()
  const { serverFunction } = serverFunctionContext

  const [entityType, entitySlug, ...fieldPath] = editorTarget.split('.')

  const renderLexical = useCallback(
    (args?: Pick<RenderLexicalServerFunctionArgs, 'initialValue'>) => {
      async function render() {
        const { Component } = (await serverFunction({
          name: 'render-lexical',
          args: {
            name,
            admin,
            editorTarget,
            initialValue: args?.initialValue ?? undefined,
            path,
            schemaPath: `${entitySlug}.${fieldPath.join('.')}`,
          } satisfies RenderLexicalServerFunctionArgs,
        })) as RenderLexicalServerFunctionReturnType

        setComponent(Component)
      }
      void render()
    },
    [serverFunction, name, admin, editorTarget, path, entitySlug, fieldPath],
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
      const lexicalServerFunctionContext: ServerFunctionsContextType = {
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
          <ServerFunctionsContext value={{ ...lexicalServerFunctionContext }}>
            {Component}
          </ServerFunctionsContext>
        )
      }

      const fieldValue: FieldType<DefaultTypedEditorState | undefined> = {
        disabled: false,
        formInitializing: false,
        formProcessing: false,
        formSubmitted: false,
        initialValue: value,
        path: path ?? name,
        setValue: setValue ?? (() => undefined),
        showError: false,
        value,
      }

      return (
        <ServerFunctionsContext value={{ ...serverFunctionContext }}>
          <FieldContext value={fieldValue}>{Component}</FieldContext>
        </ServerFunctionsContext>
      )
    }

    return Memoized
  }, [Component, serverFunctionContext, path, name, entityType, entitySlug])

  return { Component: WrappedComponent, renderLexical }
}
