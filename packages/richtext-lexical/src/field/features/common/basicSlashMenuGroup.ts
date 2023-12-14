import type { SlashMenuGroup } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'

export const basicSlashMenuGroup: SlashMenuGroup = {
  key: 'basic',
  label: ({ i18n }) => i18n.t('lexical:general:slashMenuGroupBasic'),
  options: [],
}
