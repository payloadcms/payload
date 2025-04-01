import type { SerializedLexicalNode } from 'lexical'
import type {
  ClientComponentProps,
  FieldPaths,
  RichTextFieldClient,
  RichTextField as RichTextFieldType,
  ServerComponentProps,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { renderField } from '@payloadcms/ui/forms/renderField'
import React from 'react'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type {
  LexicalFieldAdminClientProps,
  LexicalFieldAdminProps,
  LexicalRichTextFieldProps,
} from '../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { RichTextField } from '../exports/client/index.js'
import { buildInitialState } from '../utilities/buildInitialState.js'
import { initLexicalFeatures } from '../utilities/initLexicalFeatures.js'

export const RscEntryLexicalField: React.FC<
  {
    admin: LexicalFieldAdminProps
    sanitizedEditorConfig: SanitizedServerEditorConfig
  } & ClientComponentProps &
    Pick<FieldPaths, 'path'> &
    ServerComponentProps
> = async (args) => {
  const field: RichTextFieldType = args.field as RichTextFieldType
  const path = args.path ?? (args.clientField as RichTextFieldClient).name
  const schemaPath = args.schemaPath ?? path

  if (!(args?.clientField as RichTextFieldClient)?.name) {
    throw new Error('Initialized lexical RSC field without a field name')
  }

  const { clientFeatures, featureClientImportMap, featureClientSchemaMap } = initLexicalFeatures({
    clientFieldSchemaMap: args.clientFieldSchemaMap,
    fieldSchemaMap: args.fieldSchemaMap,
    i18n: args.i18n,
    path,
    payload: args.payload,
    sanitizedEditorConfig: args.sanitizedEditorConfig,
    schemaPath,
  })

  let initialLexicalFormState = {}
  if (args.siblingData?.[field.name]?.root?.children?.length) {
    initialLexicalFormState = await buildInitialState({
      context: {
        id: args.id,
        clientFieldSchemaMap: args.clientFieldSchemaMap,
        collectionSlug: args.collectionSlug,
        documentData: args.data,
        field,
        fieldSchemaMap: args.fieldSchemaMap,
        lexicalFieldSchemaPath: schemaPath,
        operation: args.operation,
        permissions: args.permissions,
        preferences: args.preferences,
        renderFieldFn: renderField,
        req: args.req,
      },
      nodeData: args.siblingData?.[field.name]?.root?.children as SerializedLexicalNode[],
    })
  }

  const placeholderFromArgs = args.admin?.placeholder
  const placeholder = placeholderFromArgs
    ? getTranslation(placeholderFromArgs, args.i18n)
    : undefined

  const admin: LexicalFieldAdminClientProps = {}
  if (placeholder) {
    admin.placeholder = placeholder
  }
  if (args.admin?.hideGutter) {
    admin.hideGutter = true
  }
  if (args.admin?.hideInsertParagraphAtEnd) {
    admin.hideInsertParagraphAtEnd = true
  }

  const props: LexicalRichTextFieldProps = {
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap, // TODO: Does client need this? Why cant this just live in the server
    field: args.clientField as RichTextFieldClient,
    forceRender: args.forceRender,
    initialLexicalFormState,
    lexicalEditorConfig: args.sanitizedEditorConfig.lexical,
    path,
    permissions: args.permissions,
    readOnly: args.readOnly,
    renderedBlocks: args.renderedBlocks,
    schemaPath,
  }
  if (Object.keys(admin).length) {
    props.admin = admin
  }

  for (const key in props) {
    if (props[key as keyof LexicalRichTextFieldProps] === undefined) {
      delete props[key as keyof LexicalRichTextFieldProps]
    }
  }

  return <RichTextField {...props} />
}
