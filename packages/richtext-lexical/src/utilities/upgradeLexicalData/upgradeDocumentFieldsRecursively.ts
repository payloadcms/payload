import type { SerializedEditorState } from 'lexical'
import type { Field } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType, tabHasName } from 'payload/shared'

import type { LexicalRichTextAdapter } from '../../types.js'

import { getEnabledNodes } from '../../lexical/nodes/index.js'

type NestedRichTextFieldsArgs = {
  data: Record<string, unknown>

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
        found += upgradeDocumentFieldsRecursively({
          data: data[field.name] as Record<string, unknown>,
          fields: field.fields,
          found,
        })
      } else {
        found += upgradeDocumentFieldsRecursively({
          data,
          fields: field.fields,
          found,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        found += upgradeDocumentFieldsRecursively({
          data: (tabHasName(tab) ? data[tab.name] : data) as Record<string, unknown>,
          fields: tab.fields,
          found,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        ;(data[field.name] as Record<string, unknown>[]).forEach((row, i) => {
          const block = field.blocks.find(({ slug }) => slug === row?.blockType)
          if (block) {
            found += upgradeDocumentFieldsRecursively({
              data: (data[field.name] as Record<string, unknown>[])[i],
              fields: block.fields,
              found,
            })
          }
        })
      }

      if (field.type === 'array') {
        ;(data[field.name] as Record<string, unknown>[]).forEach((_, i) => {
          found += upgradeDocumentFieldsRecursively({
            data: (data[field.name] as Record<string, unknown>[])[i],
            fields: field.fields,
            found,
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
