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
  fontSize: 11,
  hideCursorInOverviewRuler: true,
  lineDecorationsWidth: 12, // gap between line numbers and code
  lineHeight: 16,
  lineNumbersMinChars: 3,
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
