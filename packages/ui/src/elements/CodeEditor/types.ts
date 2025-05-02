import type { EditorProps } from '@monaco-editor/react'

export type Props = {
  maxHeight?: number
  /**
   * @default 56 (3 lines)
   */
  minHeight?: number
  readOnly?: boolean
} & EditorProps
