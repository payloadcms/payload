import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/components/utilities'

import type { EditorConfig, SanitizedEditorConfig } from './field/lexical/config/types'
import type { AdapterProps } from './types'

import { RichTextCell } from './cell'
import { RichTextField } from './field'
import { defaultEditorConfig, defaultSanitizedEditorConfig } from './field/lexical/config/default'
import { sanitizeEditorConfig } from './field/lexical/config/sanitize'
import { cloneDeep } from './field/lexical/utils/cloneDeep'

export function createLexical(
  userConfig?: (defaultEditorConfig: EditorConfig) => EditorConfig,
): RichTextAdapter<AdapterProps> {
  const finalSanitizedEditorConfig: SanitizedEditorConfig =
    userConfig == null || typeof userConfig != 'function'
      ? cloneDeep(defaultSanitizedEditorConfig)
      : sanitizeEditorConfig(userConfig(cloneDeep(defaultEditorConfig)))

  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
    }),
    afterReadPromise({
      currentDepth,
      depth,
      field,
      overrideAccess,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      return null
    },
  }
}
