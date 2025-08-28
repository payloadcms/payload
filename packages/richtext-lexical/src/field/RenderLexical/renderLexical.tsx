import type { JSX } from 'react'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import {
  createClientField,
  type PayloadRequest,
  type RichTextField,
  type RichTextFieldClient,
  type RichTextFieldServerProps,
  type ServerFunction,
} from 'payload'

import {
  lexicalEditor,
  type LexicalFieldAdminProps,
  type SanitizedServerEditorConfig,
} from '../../index.js'

export type RenderLexicalServerFunctionArgs = {
  editorTarget: string
  req: PayloadRequest
}
export type RenderLexicalServerFunctionReturnType = { Component: React.ReactNode }

export const _internal_renderLexical: ServerFunction<
  RenderLexicalServerFunctionArgs,
  Promise<RenderLexicalServerFunctionReturnType>
> = async ({ editorTarget, importMap, req }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const editor = lexicalEditor({
    features: ({ defaultFeatures }) => [],
  })

  const sanitizedEditor = await editor({
    config: req.payload.config,
    isRoot: false,
    parentIsLocalized: false,
  })
  const field: RichTextField = {
    name: 'richText',
    type: 'richText',
    editor: sanitizedEditor,
  }

  const FieldComponent = RenderServerComponent({
    Component: sanitizedEditor.FieldComponent,
    importMap,
    serverProps: {
      admin: {},
      clientField: createClientField({
        defaultIDType: req.payload.db.defaultIDType,
        field,
        i18n: req.i18n,
        importMap,
      }) as RichTextFieldClient,
      clientFieldSchemaMap: new Map<string, RichTextFieldClient>(),
      collectionSlug: 'aa',
      data: {},
      field,
      fieldSchemaMap: new Map<string, RichTextField>(),
      formState: {},
      i18n: req.i18n,
      operation: 'create',
      path: 'richText',
      payload: req.payload,
      permissions: true,
      preferences: {
        fields: {},
      },
      req,
      sanitizedEditorConfig: sanitizedEditor.editorConfig,
      schemaPath: 'richText',
      siblingData: {},
      user: req.user,
    } satisfies {
      admin: LexicalFieldAdminProps // <= new in 3.26.0
      sanitizedEditorConfig: SanitizedServerEditorConfig
    } & RichTextFieldServerProps,
  })

  return {
    Component: FieldComponent,
  }
}
