'use client'
import { FieldContext, type FieldType, useServerFunctions } from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'
import type {
  RenderLexicalServerFunctionArgs,
  RenderLexicalServerFunctionReturnType,
} from './renderLexical.js'

/**
 * @experimental - may break in minor releases
 */
export const useRenderEditor_internal_ = (args: RenderLexicalServerFunctionArgs) => {
  const { name, admin, editorTarget, initialValue, path, schemaPath } = args
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const { serverFunction } = useServerFunctions()

  const renderLexical = useCallback(() => {
    async function render() {
      const { Component } = (await serverFunction({
        name: 'render-lexical',
        args: {
          name,
          admin,
          editorTarget,
          initialValue,
          path,
          schemaPath,
        } satisfies RenderLexicalServerFunctionArgs,
      })) as RenderLexicalServerFunctionReturnType

      setComponent(Component)
    }
    void render()
  }, [serverFunction, admin, editorTarget, name, path, schemaPath, initialValue])

  const WrappedComponent = React.memo(function WrappedComponent({
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
    if (typeof value === 'undefined' && !setValue) {
      return Component
    }
    return (
      <FieldContext
        value={
          {
            disabled: false,
            formInitializing: false,
            formProcessing: false,
            formSubmitted: false,
            path: path ?? name,
            setValue: setValue ?? (() => undefined),
            showError: false,
            value,
          } satisfies FieldType<DefaultTypedEditorState | undefined>
        }
      >
        {Component}
      </FieldContext>
    )
  })

  return { Component: WrappedComponent, renderLexical }
}
