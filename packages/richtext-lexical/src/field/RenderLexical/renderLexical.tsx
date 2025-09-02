import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
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
  lexicalEditor,
  type LexicalFieldAdminProps,
  type LexicalRichTextAdapter,
  type SanitizedServerEditorConfig,
} from '../../index.js'

export type RenderLexicalServerFunctionArgs = {
  admin?: LexicalFieldAdminProps
  /**
   * 'default' or {global|collections}.entitySlug.fieldSchemaPath
   *
   * @example collections.posts.richText
   */
  editorTarget: 'default' | ({} & string)
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
   * @default field name
   */
  schemaPath?: string
}
export type RenderLexicalServerFunctionReturnType = { Component: React.ReactNode }

/**
 * @experimental - may break in minor releases
 */
export const _internal_renderLexical: ServerFunction<
  RenderLexicalServerFunctionArgs,
  Promise<RenderLexicalServerFunctionReturnType>
> = async ({ name, admin, editorTarget, importMap, initialValue, path, req, schemaPath }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  let sanitizedEditor: LexicalRichTextAdapter

  if (editorTarget === 'default') {
    sanitizedEditor = await lexicalEditor()({
      config: req.payload.config,
      isRoot: false,
      parentIsLocalized: false,
    })
  } else {
    const [entityType, entitySlug, ...fieldPath] = editorTarget.split('.')

    const schemaMap = getSchemaMap({
      collectionSlug: entityType === 'collections' ? entitySlug : undefined,
      config: req.payload.config,
      globalSlug: entityType === 'globals' ? entitySlug : undefined,
      i18n: req.i18n,
    })

    const field = schemaMap.get(`${entitySlug}.${fieldPath.join('.')}`) as RichTextField | undefined

    if (!field?.editor || typeof field.editor === 'function') {
      throw new Error(`No editor found for target: ${editorTarget}`)
    }

    sanitizedEditor = field.editor as LexicalRichTextAdapter
  }

  if (!sanitizedEditor) {
    throw new Error(`No editor found for target: ${editorTarget}`)
  }

  const field: RichTextField = {
    name,
    type: 'richText',
    editor: sanitizedEditor,
  }

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
      clientFieldSchemaMap: new Map<string, RichTextFieldClient>(),
      collectionSlug: '-',
      data: {},
      field,
      fieldSchemaMap: new Map<string, RichTextField>(),
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
