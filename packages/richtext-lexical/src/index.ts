import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/components/utilities'

import type { EditorConfig } from './field/lexical/config/types'
import type { AdapterProps } from './types'

import { RichTextCell } from './cell'
import { RichTextField } from './field'
import { defaultEditorConfig } from './field/lexical/config/default'
import { cloneDeep } from './field/lexical/utils/cloneDeep'

export function createLexical(
  userConfig?: (defaultEditorConfig: EditorConfig) => EditorConfig,
): RichTextAdapter<AdapterProps> {
  const defaultEditorConfigCloned = cloneDeep(defaultEditorConfig)

  const finalEditorConfig: EditorConfig =
    userConfig == null || typeof userConfig != 'function'
      ? defaultEditorConfigCloned
      : userConfig(defaultEditorConfigCloned)

  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: { editorConfig: finalEditorConfig },
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: { editorConfig: finalEditorConfig },
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
