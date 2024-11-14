import type { I18nClient } from '@payloadcms/translations'
import type { LexicalEditor, Spread } from 'lexical'
import type React from 'react'
import type { RefObject } from 'react'

import type { FeatureClientSchemaMap } from '../../../../types.js'

export type SlashMenuItem = {
  /** The icon which is rendered in your slash menu item. */
  Icon: React.FC
  /** Each slash menu item needs to have a unique key. The key will be matched when typing, displayed if no `label` property is set, and used for classNames. */
  key: string
  /**
   * Keywords are used to match the item for different texts typed after the '/'.
   * E.g. you might want to show a horizontal rule item if you type both /hr, /separator, /horizontal etc.
   * In addition to the keywords, the label and key will be used to find the right slash menu item.
   */
  keywords?: Array<string>
  /** The label will be displayed in your slash menu item. In order to make use of i18n, this can be a function. */
  label?:
    | ((args: {
        featureClientSchemaMap: FeatureClientSchemaMap
        i18n: I18nClient<{}, string>
        schemaPath: string
      }) => string)
    | string
  /** A function which is called when the slash menu item is selected. */
  onSelect: ({ editor, queryString }: { editor: LexicalEditor; queryString: string }) => void
}

export type SlashMenuGroup = {
  /**
   * An array of `SlashMenuItem`'s which will be displayed in the slash menu.
   */
  items: Array<SlashMenuItem>
  /**
   * Used for class names and, if label is not provided, for display. Slash menus with the same key will have their items merged together.
   */
  key: string
  /** The label will be displayed before your Slash Menu group. In order to make use of i18n, this can be a function. */
  label?:
    | ((args: {
        featureClientSchemaMap: FeatureClientSchemaMap
        i18n: I18nClient<{}, string>
        schemaPath: string
      }) => string)
    | string
}

export type SlashMenuItemInternal = {
  ref: RefObject<HTMLButtonElement | null>
} & SlashMenuItem

export type SlashMenuGroupInternal = Spread<
  {
    items: Array<SlashMenuItemInternal>
  },
  SlashMenuGroup
>
