import type { I18n } from '@payloadcms/translations'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'
import type React from 'react'

export type SlashMenuItem = {
  // Icon for display
  Icon: React.FC

  // Used for class names and, if label is not provided, for display.
  key: string
  // TBD
  keyboardShortcut?: string
  // For extra searching.
  keywords?: Array<string>
  label?: (({ i18n }: { i18n: I18n }) => string) | string
  // What happens when you select this item?
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
}

export type SlashMenuGroup = {
  items: Array<SlashMenuItem>
  key: string
  // Used for class names and, if label is not provided, for display.
  label?: (({ i18n }: { i18n: I18n }) => string) | string
}

export type SlashMenuItemInternal = SlashMenuItem & {
  ref: MutableRefObject<HTMLButtonElement | null>
}

export type SlashMenuGroupInternal = SlashMenuGroup & {
  items: Array<SlashMenuItemInternal>
}
