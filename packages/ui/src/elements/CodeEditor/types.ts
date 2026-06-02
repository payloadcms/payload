import type { EditorProps } from '@monaco-editor/react'

export type Props = EditorProps & {
  maxHeight?: number
  /**
   * @default 56 (3 lines)
   */
  minHeight?: number
  readOnly?: boolean
  recalculatedHeightAt?: number
}
