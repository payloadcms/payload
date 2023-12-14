import type { SlashMenuGroup } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'

export const listsSlashMenuGroup: SlashMenuGroup = {
  key: 'lists',
  label: ({ i18n }) => i18n.t('lexical:general:slashMenuGroupLists'),
  options: [],
}
