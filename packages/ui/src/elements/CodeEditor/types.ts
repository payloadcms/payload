import type { EditorProps } from '@monaco-editor/react'

export type Props = {
  readOnly?: boolean
} & EditorProps

export type OverlayProps = {
  onMouseEnter: () => void
  onMouseLeave: () => void
  showOverlay: boolean
}
