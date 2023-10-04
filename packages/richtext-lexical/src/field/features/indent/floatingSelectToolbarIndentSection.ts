import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../lexical/plugins/FloatingSelectToolbar/types'

import './index.scss'

export const IndentSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    entries,
    key: 'indent',
    order: 3,
    type: 'buttons',
  }
}
