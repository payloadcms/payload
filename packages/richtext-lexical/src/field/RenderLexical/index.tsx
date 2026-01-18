'use client'
import type { RichTextField } from '@ruya.sa/payload'

import {
  FieldContext,
  FieldPathContext,
  type FieldType,
  type RenderFieldServerFnArgs,
  ServerFunctionsContext,
  type ServerFunctionsContextType,
  ShimmerEffect,
  useServerFunctions,
} from '@ruya.sa/ui'
import React, { useCallback, useEffect, useRef } from 'react'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'
import type { LexicalRichTextField } from '../../types.js'

/**
 * Utility to render a lexical editor on the client.
 *
 * @experimental - may break in minor releases
 * @todo - replace this with a general utility that works for all fields. Maybe merge with packages/ui/src/forms/RenderFields/RenderField.tsx
 */
export const RenderLexical: React.FC<
  /**
   * If value or setValue, or both, is provided, this component will manage its own value.
   * If neither is passed, it will rely on the parent form to manage the value.
   */
  {
    /**
     * Override the loading state while the field component is being fetched and rendered.
     */
    Loading?: React.ReactElement

    setValue?: FieldType<DefaultTypedEditorState | undefined>['setValue']
    value?: FieldType<DefaultTypedEditorState | undefined>['value']
  } & RenderFieldServerFnArgs<LexicalRichTextField>
> = (args) => {
  const { field, initialValue, Loading, path, schemaPath, setValue, value } = args
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const serverFunctionContext = useServerFunctions()
  const { _internal_renderField } = serverFunctionContext

  const [entityType, entitySlug] = schemaPath.split('.', 2)

  const fieldPath = path ?? (field && 'name' in field ? field?.name : '') ?? ''

  const renderLexical = useCallback(() => {
    async function render() {
      const { Field } = await _internal_renderField({
        field: {
          ...((field as RichTextField) || {}),
          type: 'richText',
          admin: {
            ...((field as RichTextField)?.admin || {}),
            // When using "fake" anchor fields, hidden is often set to true. We need to override that here to ensure the field is rendered.
            hidden: false,
          },
        },
        initialValue: initialValue ?? undefined,
        path,
        schemaPath,
      })

      setComponent(Field)
    }
    void render()
  }, [_internal_renderField, schemaPath, path, field, initialValue])

  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    mounted.current = true
    void renderLexical()
  }, [renderLexical])

  if (!Component) {
    return typeof Loading !== 'undefined' ? Loading : <ShimmerEffect />
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
