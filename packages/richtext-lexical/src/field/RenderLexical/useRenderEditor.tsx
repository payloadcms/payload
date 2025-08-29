'use client'
import { useServerFunctions } from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'
import type {
  RenderLexicalServerFunctionArgs,
  RenderLexicalServerFunctionReturnType,
} from './renderLexical.js'

export const useRenderEditor_internal_ = (
  args: {
    initialState: DefaultTypedEditorState
    name: string
  } & RenderLexicalServerFunctionArgs,
) => {
  const { name, admin, editorTarget, initialState } = args
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const { serverFunction } = useServerFunctions()

  const renderLexical = useCallback(() => {
    async function render() {
      const { Component } = (await serverFunction({
        name: 'render-lexical',
        args: {
          admin,
          editorTarget,
        } as RenderLexicalServerFunctionArgs,
      })) as RenderLexicalServerFunctionReturnType

      setComponent(Component)
    }
    void render()
  }, [editorTarget, serverFunction, admin])

  return { Component, renderLexical }
}
