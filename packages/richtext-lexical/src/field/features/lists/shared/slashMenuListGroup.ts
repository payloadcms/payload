import type {
  SlashMenuGroup,
  SlashMenuItem,
} from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'

export function slashMenuListGroupWithItems(items: SlashMenuItem[]): SlashMenuGroup {
  return {
    items,
    key: 'lists',
    label: ({ i18n }) => {
      return i18n.t('lexical:general:slashMenuListGroupLabel')
    },
  }
}
