import type { SerializedLexicalNode } from 'lexical'
import type {
  ClientComponentProps,
  FieldPaths,
  RichTextFieldClient,
  RichTextField as RichTextFieldType,
  ServerComponentProps,
} from 'payload'

import { renderField } from '@payloadcms/ui/forms/renderField'
import React from 'react'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { LexicalFieldAdminProps } from '../types.js'

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
  const { clientFeatures, featureClientSchemaMap } = initLexicalFeatures({
    fieldSchemaMap: args.fieldSchemaMap,
    i18n: args.i18n,
    path,
    payload: args.payload,
    sanitizedEditorConfig: args.sanitizedEditorConfig,
    schemaPath,
  })

  let initialLexicalFormState = {}
  if (args.data?.[field.name]?.root?.children?.length) {
    initialLexicalFormState = await buildInitialState({
      context: {
        id: args.id,
        collectionSlug: args.collectionSlug,
        field,
        fieldSchemaMap: args.fieldSchemaMap,
        lexicalFieldSchemaPath: schemaPath,
        operation: args.operation,
        permissions: args.permissions,
        preferences: args.preferences,
        renderFieldFn: renderField,
        req: args.req,
      },
      nodeData: args.data?.[field.name]?.root?.children as SerializedLexicalNode[],
    })
  }

  return (
    <RichTextField
      admin={args.admin}
      clientFeatures={clientFeatures}
      featureClientSchemaMap={featureClientSchemaMap}
      field={args.clientField as RichTextFieldClient}
      forceRender={args.forceRender}
      initialLexicalFormState={initialLexicalFormState}
      lexicalEditorConfig={args.sanitizedEditorConfig.lexical}
      path={path}
      permissions={args.permissions}
      readOnly={args.readOnly}
      renderedBlocks={args.renderedBlocks}
      schemaPath={schemaPath}
    />
  )
}
