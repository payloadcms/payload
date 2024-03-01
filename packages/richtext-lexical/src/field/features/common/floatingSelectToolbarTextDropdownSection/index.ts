import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

import { TextIcon } from '../../../lexical/ui/icons/Text'

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
