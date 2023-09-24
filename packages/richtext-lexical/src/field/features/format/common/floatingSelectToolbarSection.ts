import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

import './index.scss'

export const SectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    entries,
    key: 'format',
    order: 3,
    type: 'buttons',
  }
}
