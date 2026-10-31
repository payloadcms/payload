import type { I18nClient } from '@payloadcms/translations'

/**
 * Names for the built-in dropdown groups. Without one, a dropdown with no active item is
 * announced by its group key (`add`, `align`, `inlineBlocks`), which is never translated.
 */
const groupLabelKeys: Record<string, string> = {
  add: 'lexical:general:insert',
  align: 'lexical:general:alignment',
  blocks: 'lexical:blocks:label',
  inlineBlocks: 'lexical:blocks:inlineBlocks:label',
  text: 'lexical:general:textStyle',
}

export const getDropdownGroupLabel = ({
  groupKey,
  i18n,
}: {
  groupKey: string
  i18n: I18nClient<Record<string, never>, string>
}): string | undefined => {
  return Object.hasOwn(groupLabelKeys, groupKey) ? i18n.t(groupLabelKeys[groupKey]!) : undefined
}
