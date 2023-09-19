import type { LexicalEditor, RangeSelection } from 'lexical'
import type React from 'react'

export type Feature = {
  floatingSelectToolbar?: {
    buttons?: {
      format?: {
        children?: React.FC<any>
        /** Use componentOverride to ignore the children and onClick properties. It does not use the default, pre-defined format Button component */
        componentOverride?: React.FC<{ anchorElem: HTMLElement; editor: LexicalEditor }>
        isActive?: (editor: LexicalEditor, selection: RangeSelection) => boolean
        key: string
        onClick?: (editor: LexicalEditor) => void
      }[]
    }
  }
}
