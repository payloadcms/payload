import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../../lexical/plugins/FloatingSelectToolbar/types'

export const TextDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    type: 'dropdown',
    ChildComponent: () =>
      // @ts-expect-error-next-line
      import('../../../lexical/ui/icons/Text').then((module) => module.TextIcon),
    entries,
    key: 'dropdown-text',
    order: 1,
  }
}
