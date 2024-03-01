import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

export const FeaturesSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    type: 'buttons',
    entries,
    key: 'features',
    order: 5,
  }
}
