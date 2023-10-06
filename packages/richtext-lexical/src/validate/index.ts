import type { SerializedEditorState } from 'lexical'
import type { RichTextField, Validate } from 'payload/types'

import type { SanitizedEditorConfig } from '../field/lexical/config/types'

import { defaultRichTextValue, defaultRichTextValueV2 } from '../populate/defaultValue'
import { validateNodes } from './validateNodes'

export const richTextValidateHOC = ({ editorConfig }: { editorConfig: SanitizedEditorConfig }) => {
  const richTextValidate: Validate<
    SerializedEditorState,
    SerializedEditorState,
    unknown,
    RichTextField
  > = async (value, options) => {
    const { required, t } = options

    if (required) {
      if (
        !value ||
        !value?.root?.children ||
        !value?.root?.children?.length ||
        JSON.stringify(value) === JSON.stringify(defaultRichTextValue) ||
        JSON.stringify(value) === JSON.stringify(defaultRichTextValueV2)
      ) {
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
        payloadConfig: options.config,
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
