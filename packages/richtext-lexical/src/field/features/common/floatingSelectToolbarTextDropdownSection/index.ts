import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

import { TextIcon } from '../../../lexical/ui/icons/Text'
import './index.scss'

export const TextDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    ChildComponent: TextIcon,
    entries,
    key: 'dropdown-text',
    order: 1,
    type: 'dropdown',
  }
}
