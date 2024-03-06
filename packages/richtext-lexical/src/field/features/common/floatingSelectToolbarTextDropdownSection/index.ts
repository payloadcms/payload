import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types.js'

import { TextIcon } from '../../../lexical/ui/icons/Text/index.js'

export const TextDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    type: 'dropdown',
    ChildComponent: TextIcon,
    entries,
    key: 'dropdown-text',
    order: 1,
  }
}
