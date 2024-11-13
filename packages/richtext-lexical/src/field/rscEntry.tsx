import type {
  ClientComponentProps,
  FieldPaths,
  RichTextFieldClient,
  ServerComponentProps,
} from 'payload'

import React from 'react'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { LexicalFieldAdminProps } from '../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { RichTextField } from '../exports/client/index.js'
import { initLexicalFeatures } from '../utilities/initLexicalFeatures.js'
export const RscEntryLexicalField: React.FC<
  {
    admin: LexicalFieldAdminProps
    sanitizedEditorConfig: SanitizedServerEditorConfig
  } & ClientComponentProps &
    Pick<FieldPaths, 'path'> &
    ServerComponentProps
> = (args) => {
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
  return (
    <RichTextField
      admin={args.admin}
      clientFeatures={clientFeatures}
      featureClientSchemaMap={featureClientSchemaMap}
      field={args.clientField as RichTextFieldClient}
      forceRender={args.forceRender}
      lexicalEditorConfig={args.sanitizedEditorConfig.lexical}
      path={path}
      permissions={args.permissions}
      readOnly={args.readOnly}
      renderedBlocks={args.renderedBlocks}
      schemaPath={schemaPath}
    />
  )
}
