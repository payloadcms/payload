import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'
import {
  createClientField,
  type RichTextField,
  type RichTextFieldClient,
  type RichTextFieldServerProps,
  type ServerFunction,
} from 'payload'

import {
  type DefaultTypedEditorState,
  type LexicalFieldAdminProps,
  type LexicalRichTextAdapter,
  type SanitizedServerEditorConfig,
} from '../../index.js'

export type RenderLexicalServerFunctionArgs = {
  admin?: LexicalFieldAdminProps
  /**
   * {global|collection}.entitySlug.fieldSchemaPath
   *
   * @example collection.posts.richText
   */
  editorTarget: string
  /**
   * Pass the value this richtext field will receive when rendering it on the server.
   * This helps provide initial state for sub-fields that are immediately rendered (like blocks)
   * so that we can avoid multiple waterfall requests for each block that renders on the client.
   */
  initialValue?: DefaultTypedEditorState
  /**
   * Name of the field to render
   */
  name: string
  /**
   * Path to the field to render
   * @default field name
   */
  path?: string
  /**
   * Schema path to the field to render.
   */
  schemaPath: string
}
export type RenderLexicalServerFunctionReturnType = { Component: React.ReactNode }

/**
 * @experimental - may break in minor releases
 */
export const _internal_renderLexical: ServerFunction<
  RenderLexicalServerFunctionArgs,
  Promise<RenderLexicalServerFunctionReturnType>
  // eslint-disable-next-line @typescript-eslint/require-await
> = async ({ name, admin, editorTarget, importMap, initialValue, path, req, schemaPath }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const [entityType, entitySlug, ...fieldPath] = editorTarget.split('.')

  const schemaMap = getSchemaMap({
    collectionSlug: entityType === 'collection' ? entitySlug : undefined,
    config: req.payload.config,
    globalSlug: entityType === 'global' ? entitySlug : undefined,
    i18n: req.i18n,
  })

  const targetField = schemaMap.get(`${entitySlug}.${fieldPath.join('.')}`) as
    | RichTextField
    | undefined

  if (!targetField?.editor || typeof targetField.editor === 'function') {
    throw new Error(`No editor found for target: ${editorTarget}`)
  }

  const sanitizedEditor = targetField.editor as LexicalRichTextAdapter

  if (!sanitizedEditor) {
    throw new Error(`No editor found for target: ${editorTarget}`)
  }

  const field: RichTextField = {
    name,
    type: 'richText',
    editor: sanitizedEditor,
  }

  // Provide client schema map as it would have been provided if the target editor field would have been rendered.
  // Only then will it contain all the lexical-internal entries
  const clientSchemaMap = getClientSchemaMap({
    collectionSlug: entityType === 'collection' ? entitySlug : undefined,
    config: getClientConfig({
      config: req.payload.config,
      i18n: req.i18n,
      importMap: req.payload.importMap,
    }),
    globalSlug: entityType === 'global' ? entitySlug : undefined,
    i18n: req.i18n,
    payload: req.payload,
    schemaMap,
  })

  const FieldComponent = RenderServerComponent({
    Component: sanitizedEditor.FieldComponent,
    importMap,
    serverProps: {
      admin: admin ?? {},
      clientField: createClientField({
        defaultIDType: req.payload.db.defaultIDType,
        field,
        i18n: req.i18n,
        importMap,
      }) as RichTextFieldClient,
      clientFieldSchemaMap: clientSchemaMap,
      // collectionSlug is typed incorrectly - @todo make it accept undefined in 4.0
      collectionSlug: entityType === 'collection' && entitySlug ? entitySlug : '-',
      data: {},
      field,
      fieldSchemaMap: schemaMap,
      forceRender: true,
      formState: {},
      i18n: req.i18n,
      operation: 'create',
      path: path ?? name,
      payload: req.payload,
      permissions: true,
      preferences: {
        fields: {},
      },
      req,
      sanitizedEditorConfig: sanitizedEditor.editorConfig,
      schemaPath: schemaPath ?? name,
      siblingData: initialValue
        ? {
            [name]: initialValue,
          }
        : {},
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
