import type { EditorProps } from '@monaco-editor/react'

export const defaultOptions: Pick<
  EditorProps['options'],
  'insertSpaces' | 'tabSize' | 'trimAutoWhitespace'
> = {
  insertSpaces: false,
  tabSize: 4,
  trimAutoWhitespace: false,
}

export const defaultGlobalEditorOptions: Omit<
  EditorProps['options'],
  'detectIndentation' | 'insertSpaces' | 'tabSize' | 'trimAutoWhitespace'
> = {
  hideCursorInOverviewRuler: true,
  minimap: {
    enabled: false,
  },
  overviewRulerBorder: false,
  readOnly: false,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
}
