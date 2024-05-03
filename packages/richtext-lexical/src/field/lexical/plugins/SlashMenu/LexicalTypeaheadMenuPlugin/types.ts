import type { I18n } from '@payloadcms/translations'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'
import type React from 'react'

export type SlashMenuItem = {
  // Icon for display
  Icon: React.FC

  displayName?: (({ i18n }: { i18n: I18n }) => string) | string
  // Used for class names and, if displayName is not provided, for display.
  key: string
  // TBD
  keyboardShortcut?: string
  // For extra searching.
  keywords?: Array<string>
  // What happens when you select this item?
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
}

export type SlashMenuGroup = {
  // Used for class names and, if displayName is not provided, for display.
  displayName?: (({ i18n }: { i18n: I18n }) => string) | string
  items: Array<SlashMenuItem>
  key: string
}

export type SlashMenuItemInternal = SlashMenuItem & {
  ref: MutableRefObject<HTMLButtonElement | null>
}

export type SlashMenuGroupInternal = SlashMenuGroup & {
  items: Array<SlashMenuItemInternal>
}
