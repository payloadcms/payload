import type { I18nClient } from '@payloadcms/translations'
import type { LexicalEditor } from 'lexical'
import type { MutableRefObject } from 'react'
import type React from 'react'

export type SlashMenuItem = {
  /** The icon which is rendered in your slash menu item. */
  Icon: React.FC
  /** Each slash menu item needs to have a unique key. The key will be matched when typing, displayed if no `label` property is set, and used for classNames. */
  key: string
  /**
   * Keywords are used in order to match the item for different texts typed after the '/'.
   * E.g. you might want to show a horizontal rule item if you type both /hr, /separator, /horizontal etc.
   * Additionally to the keywords, the label and key will be used to match the correct slash menu item.
   */
  keywords?: Array<string>
  /** The label will be displayed in your slash menu item. In order to make use of i18n, this can be a function. */
  label?: (({ i18n }: { i18n: I18nClient<{}, string> }) => string) | string
  /** A function which is called when the slash menu item is selected. */
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
}

export type SlashMenuGroup = {
  items: Array<SlashMenuItem>
  // Used for class names and, if label is not provided, for display.
  key: string
  label?: (({ i18n }: { i18n: I18nClient<{}, string> }) => string) | string
}

export type SlashMenuItemInternal = SlashMenuItem & {
  ref: MutableRefObject<HTMLButtonElement | null>
}

export type SlashMenuGroupInternal = SlashMenuGroup & {
  items: Array<SlashMenuItemInternal>
}
