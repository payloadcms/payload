import type { i18n } from 'i18next'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'
import type React from 'react'

export class SlashMenuOption {
  // Icon for display
  Icon: () => Promise<React.FC>

  displayName?: (({ i18n }: { i18n: i18n }) => string) | string
  // Used for class names and, if displayName is not provided, for display.
  key: string
  // TBD
  keyboardShortcut?: string
  // For extra searching.
  keywords: Array<string>
  // What happens when you select this option?
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void

  ref?: MutableRefObject<HTMLElement | null>

  constructor(
    key: string,
    options: {
      Icon: () => Promise<React.FC>
      displayName?: (({ i18n }: { i18n: i18n }) => string) | string
      keyboardShortcut?: string
      keywords?: Array<string>
      onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
    },
  ) {
    this.key = key
    this.ref = { current: null }
    this.setRefElement = this.setRefElement.bind(this)

    this.displayName = options.displayName
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
  // Used for class names and, if displayName is not provided, for display.
  displayName?: (({ i18n }: { i18n: i18n }) => string) | string
  key: string
  options: Array<SlashMenuOption>
}
