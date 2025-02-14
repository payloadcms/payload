import type { SerializedEditorState } from 'lexical'
import type { Field, FlattenedBlock, Payload } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType, tabHasName } from 'payload/shared'

import type { LexicalRichTextAdapter } from '../../types.js'

import { getEnabledNodes } from '../../lexical/nodes/index.js'

type NestedRichTextFieldsArgs = {
  data: Record<string, unknown>

  fields: Field[]
  found: number
  payload: Payload
}

export const upgradeDocumentFieldsRecursively = ({
  data,
  fields,
  found,
  payload,
}: NestedRichTextFieldsArgs): number => {
  for (const field of fields) {
    if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        found += upgradeDocumentFieldsRecursively({
          data: data[field.name] as Record<string, unknown>,
          fields: field.fields,
          found,
          payload,
        })
      } else {
        found += upgradeDocumentFieldsRecursively({
          data,
          fields: field.fields,
          found,
          payload,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        found += upgradeDocumentFieldsRecursively({
          data: (tabHasName(tab) ? data[tab.name] : data) as Record<string, unknown>,
          fields: tab.fields,
          found,
          payload,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        ;(data[field.name] as Record<string, unknown>[]).forEach((row) => {
          const blockTypeToMatch: string = row?.blockType as string

          const block =
            payload.blocks[blockTypeToMatch] ??
            ((field.blockReferences ?? field.blocks).find(
              (block) => typeof block !== 'string' && block.slug === blockTypeToMatch,
            ) as FlattenedBlock | undefined)

          if (block) {
            found += upgradeDocumentFieldsRecursively({
              data: row,
              fields: block.fields,
              found,
              payload,
            })
          }
        })
      }

      if (field.type === 'array') {
        ;(data[field.name] as Record<string, unknown>[]).forEach((row) => {
          found += upgradeDocumentFieldsRecursively({
            data: row,
            fields: field.fields,
            found,
            payload,
          })
        })
      }
    }

    if (
      field.type === 'richText' &&
      data[field.name] &&
      !Array.isArray(data[field.name]) &&
      'root' in (data[field.name] as Record<string, unknown>)
    ) {
      // Lexical richText
      const editor: LexicalRichTextAdapter = field.editor as LexicalRichTextAdapter
      if (editor && typeof editor === 'object') {
        if ('features' in editor && editor.features?.length) {
          // Load lexical editor into lexical, then save it immediately
          const editorState = data[field.name] as SerializedEditorState

          const headlessEditor = createHeadlessEditor({
            nodes: getEnabledNodes({
              editorConfig: editor.editorConfig,
            }),
          })
          headlessEditor.update(
            () => {
              headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState))
            },
            { discrete: true },
          )

          // get editor state
          data[field.name] = headlessEditor.getEditorState().toJSON()

          found++
        }
      }
    }
  }

  return found
}
