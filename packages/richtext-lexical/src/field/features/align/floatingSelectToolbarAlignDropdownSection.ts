import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../lexical/plugins/FloatingSelectToolbar/types'

import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft'

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
