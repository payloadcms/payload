import type { i18n } from 'i18next'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'
import type React from 'react'

export class SlashMenuOption {
  // Icon for display
  Icon: () => Promise<React.FC>

  // Used for class names and, if label is not provided, for display.
  key: string
  // TBD
  keyboardShortcut?: string
  // For extra searching.
  keywords: Array<string>
  label?: (({ i18n }: { i18n: i18n }) => string) | string
  // What happens when you select this option?
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void

  ref?: MutableRefObject<HTMLElement | null>

  constructor(
    key: string,
    options: {
      Icon: () => Promise<React.FC>
      keyboardShortcut?: string
      keywords?: Array<string>
      label?: (({ i18n }: { i18n: i18n }) => string) | string
      onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
    },
  ) {
    this.key = key
    this.ref = { current: null }
    this.setRefElement = this.setRefElement.bind(this)

    this.label = options.label
    this.keywords = options.keywords || []
    this.Icon = options.Icon
    this.keyboardShortcut = options.keyboardShortcut
    this.onSelect = options.onSelect.bind(this)
  }

  setRefElement(element: HTMLElement | null) {
    this.ref = { current: element }
  }
}

export class SlashMenuGroup {
  key: string
  // Used for class names and, if label is not provided, for display.
  label?: (({ i18n }: { i18n: i18n }) => string) | string
  options: Array<SlashMenuOption>
}
