import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../lexical/plugins/FloatingSelectToolbar/types'

import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft'
import './index.scss'

export const AlignDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    ChildComponent: AlignLeftIcon,
    entries,
    key: 'dropdown-align',
    order: 2,
    type: 'dropdown',
  }
}
