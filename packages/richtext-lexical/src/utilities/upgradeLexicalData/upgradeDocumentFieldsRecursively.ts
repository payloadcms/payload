import type { SerializedEditorState } from 'lexical'
import type { Field } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/shared'

import type { LexicalRichTextAdapter } from '../../types.js'

import { getEnabledNodes } from '../../lexical/nodes/index.js'

type NestedRichTextFieldsArgs = {
  data: unknown

  fields: Field[]
  found: number
}

export const upgradeDocumentFieldsRecursively = ({
  data,
  fields,
  found,
}: NestedRichTextFieldsArgs): number => {
  for (const field of fields) {
    if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        upgradeDocumentFieldsRecursively({
          data: data[field.name],
          fields: field.fields,
          found,
        })
      } else {
        upgradeDocumentFieldsRecursively({
          data,
          found,

          fields: field.fields,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        upgradeDocumentFieldsRecursively({
          data,
          found,

          fields: tab.fields,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        data[field.name].forEach((row, i) => {
          const block = field.blocks.find(({ slug }) => slug === row?.blockType)
          if (block) {
            upgradeDocumentFieldsRecursively({
              data: data[field.name][i],
              found,

              fields: block.fields,
            })
          }
        })
      }

      if (field.type === 'array') {
        data[field.name].forEach((_, i) => {
          upgradeDocumentFieldsRecursively({
            data: data[field.name][i],
            found,

            fields: field.fields,
          })
        })
      }
    }

    if (
      field.type === 'richText' &&
      data[field.name] &&
      !Array.isArray(data[field.name]) &&
      'root' in data[field.name]
    ) {
      // Lexical richText
      const editor: LexicalRichTextAdapter = field.editor as LexicalRichTextAdapter
      if (editor && typeof editor === 'object') {
        if ('features' in editor && editor.features?.length) {
          // Load lexical editor into lexical, then save it immediately
          const editorState: SerializedEditorState = data[field.name]

          const headlessEditor = createHeadlessEditor({
            nodes: getEnabledNodes({
              editorConfig: editor.editorConfig,
            }),
          })
          headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState))

          // get editor state
          data[field.name] = headlessEditor.getEditorState().toJSON()

          found++
        }
      }
    }
  }

  return found
}
