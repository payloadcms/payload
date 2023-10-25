import type { i18n } from 'i18next'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'

export class SlashMenuOption {
  Icon: React.FC

  displayName?: ({ i18n }: { i18n: i18n }) => string
  // Icon for display
  key: string
  // TBD
  keyboardShortcut?: string
  // For extra searching.
  keywords: Array<string>
  // What happens when you select this option?
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void

  ref?: MutableRefObject<HTMLElement | null>

  // What shows up in the editor
  title: string

  constructor(
    title: string,
    options: {
      Icon: React.FC
      displayName?: ({ i18n }: { i18n: i18n }) => string
      keyboardShortcut?: string
      keywords?: Array<string>
      onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
    },
  ) {
    this.key = title
    this.ref = { current: null }
    this.setRefElement = this.setRefElement.bind(this)

    this.title = title
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
  options: Array<SlashMenuOption>
  title: string
}
