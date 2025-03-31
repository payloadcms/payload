import type { SerializedLexicalNode } from 'lexical'
import type {
  ClientFieldSchemaMap,
  DocumentPreferences,
  FieldSchemaMap,
  FormState,
  Operation,
  PayloadRequest,
  RichTextField,
  SanitizedFieldPermissions,
} from 'payload'

import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'

import type { SerializedBlockNode } from '../nodeTypes.js'

export type InitialLexicalFormState = {
  [nodeID: string]: {
    [key: string]: any
    formState?: FormState
  }
}

type Props = {
  context: {
    clientFieldSchemaMap: ClientFieldSchemaMap
    collectionSlug: string
    documentData?: any
    field: RichTextField
    fieldSchemaMap: FieldSchemaMap
    id?: number | string
    lexicalFieldSchemaPath: string
    operation: Operation
    permissions?: SanitizedFieldPermissions
    preferences: DocumentPreferences
    renderFieldFn: any
    req: PayloadRequest
  }
  initialState?: InitialLexicalFormState
  nodeData: SerializedLexicalNode[]
}

export async function buildInitialState({
  context,
  initialState: initialStateFromArgs,
  nodeData,
}: Props): Promise<InitialLexicalFormState> {
  let initialState: InitialLexicalFormState = initialStateFromArgs ?? {}
  for (const node of nodeData) {
    if ('children' in node) {
      initialState = await buildInitialState({
        context,
        initialState,
        nodeData: node.children as SerializedLexicalNode[],
      })
    }

    if (node.type === 'block' || node.type === 'inlineBlock') {
      const blockNode = node as SerializedBlockNode
      const id = blockNode?.fields?.id
      if (!id) {
        continue
      }

      const schemaFieldsPath =
        node.type === 'block'
          ? `${context.lexicalFieldSchemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockNode.fields.blockType}.fields`
          : `${context.lexicalFieldSchemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${blockNode.fields.blockType}.fields`

      // Build form state for the block

      const formStateResult = await fieldSchemasToFormState({
        id: context.id,
        clientFieldSchemaMap: context.clientFieldSchemaMap,
        collectionSlug: context.collectionSlug,
        data: blockNode.fields,
        documentData: context.documentData,
        fields: (context.fieldSchemaMap.get(schemaFieldsPath) as any)?.fields,
        fieldSchemaMap: context.fieldSchemaMap,
        initialBlockData: blockNode.fields,
        operation: context.operation as any, // TODO: Type
        permissions: true,
        preferences: context.preferences,
        renderAllFields: true, // If this function runs, the parent lexical field is being re-rendered => thus we can assume all its sub-fields need to be re-rendered
        renderFieldFn: context.renderFieldFn,
        req: context.req,
        schemaPath: schemaFieldsPath,
      })

      if (!initialState[id]) {
        initialState[id] = {}
      }

      initialState[id].formState = formStateResult

      if (node.type === 'block') {
        const currentFieldPreferences = context.preferences?.fields?.[context.field.name]
        const collapsedArray = currentFieldPreferences?.collapsed
        if (Array.isArray(collapsedArray) && collapsedArray.includes(id)) {
          initialState[id].collapsed = true
        }
      }
    }
  }
  return initialState
}
