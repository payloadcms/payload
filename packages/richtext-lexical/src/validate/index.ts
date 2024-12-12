import type { SerializedEditorState } from 'lexical'
import type { RichTextField, Validate } from 'payload'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'

import { hasText } from './hasText.js'
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

    if (required && hasText(value) === false) {
      return t('validation:required')
    }

    // Traverse through nodes and validate them. Just like a node can hook into the population process (e.g. link or relationship nodes),
    // they can also hook into the validation process. E.g. a block node probably has fields with validation rules.

    const rootNodes = value?.root?.children
    if (rootNodes && Array.isArray(rootNodes) && rootNodes?.length) {
      return await validateNodes({
        nodes: rootNodes,
        nodeValidations: editorConfig.features.validations,
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
