import type {
  FloatingToolbarSection,
  FloatingToolbarSectionEntry,
} from '../../lexical/plugins/FloatingSelectToolbar/types'

export const AlignDropdownSectionWithEntries = (
  entries: FloatingToolbarSectionEntry[],
): FloatingToolbarSection => {
  return {
    ChildComponent: () =>
      // @ts-expect-error
      import('../../lexical/ui/icons/AlignLeft').then((module) => module.AlignLeftIcon),
    entries,
    key: 'dropdown-align',
    order: 2,
    type: 'dropdown',
  }
}
