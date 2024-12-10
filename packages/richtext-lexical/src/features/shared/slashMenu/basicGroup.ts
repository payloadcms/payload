import type {
  SlashMenuGroup,
  SlashMenuItem,
} from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'

export function slashMenuBasicGroupWithItems(items: SlashMenuItem[]): SlashMenuGroup {
  return {
    items,
    key: 'basic',
    label: ({ i18n }) => {
      return i18n.t('lexical:general:slashMenuBasicGroupLabel')
    },
  }
}
