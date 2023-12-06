import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

export const TextDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    ChildComponent: () =>
      // @ts-expect-error
      import('../../../lexical/ui/icons/Text').then((module) => module.TextIcon),
    entries,
    key: 'dropdown-text',
    order: 1,
    type: 'dropdown',
  }
}
