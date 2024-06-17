import type { SerializedEditorState, SerializedParagraphNode } from 'lexical'
import type { RichTextField, Validate } from 'payload'

import type { SanitizedServerEditorConfig } from '../field/lexical/config/types.js'

import { validateNodes } from './validateNodes.js'

export const richTextValidateHOC = ({
  editorConfig,
}: {
  editorConfig: SanitizedServerEditorConfig
}) => {
  const richTextValidate: Validate<SerializedEditorState, unknown, unknown, RichTextField> = async (
    value,
    options,
  ) => {
    const {
      req: { t },
      required,
    } = options

    if (required) {
      const hasChildren = value?.root?.children?.length

      const hasOnlyEmptyParagraph =
        (value?.root?.children?.length === 1 &&
          value?.root?.children[0]?.type === 'paragraph' &&
          (value?.root?.children[0] as SerializedParagraphNode)?.children?.length === 0) ||
        ((value?.root?.children[0] as SerializedParagraphNode)?.children?.length === 1 &&
          (value?.root?.children[0] as SerializedParagraphNode)?.children[0]?.type === 'text' &&
          (value?.root?.children[0] as SerializedParagraphNode)?.children[0]?.['text'] === '')

      if (!hasChildren || hasOnlyEmptyParagraph) {
        return t('validation:required')
      }
    }

    // Traverse through nodes and validate them. Just like a node can hook into the population process (e.g. link or relationship nodes),
    // they can also hook into the validation process. E.g. a block node probably has fields with validation rules.

    const rootNodes = value?.root?.children
    if (rootNodes && Array.isArray(rootNodes) && rootNodes?.length) {
      return await validateNodes({
        nodeValidations: editorConfig.features.validations,
        nodes: rootNodes,
        validation: {
          options,
          value,
        },
      })
    }

    return true
  }

  return richTextValidate
}
