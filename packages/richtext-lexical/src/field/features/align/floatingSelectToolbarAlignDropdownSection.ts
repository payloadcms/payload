import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../lexical/plugins/FloatingSelectToolbar/types.js'

import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft/index.js'

export const AlignDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    type: 'dropdown',
    ChildComponent: AlignLeftIcon,
    entries,
    key: 'dropdown-align',
    order: 2,
  }
}
