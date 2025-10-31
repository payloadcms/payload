import type { TreeViewItem } from 'payload/shared'

import type { SectionItem } from '../NestedSectionsTable/types.js'

type Args = {
  i18nLanguage: string
  items: TreeViewItem[]
}

export type ItemKey = `${string}-${number | string}`

export function buildItemHierarchy({ i18nLanguage, items }: Args): SectionItem[] {
  // Create a map to store section rows
  const sectionRowMap = new Map<ItemKey, SectionItem>()

  // Convert each item to a SectionRow
  items.forEach((item) => {
    sectionRowMap.set(item.itemKey, {
      name: item.value.title,
      hasChildren: item.hasChildren,
      itemKey: item.itemKey,
      rows: [],
      updatedAt: item.value.updatedAt
        ? new Date(item.value.updatedAt).toLocaleDateString(i18nLanguage, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
    })
  })

  // Build the hierarchy
  const rootSections: SectionItem[] = []

  items.forEach((item) => {
    const sectionRow = sectionRowMap.get(item.itemKey)
    if (!sectionRow) {
      return
    }

    if (item.parentItemKey) {
      // This is a child - add it to its parent's rows array
      const parentRow = sectionRowMap.get(item.parentItemKey)
      if (parentRow) {
        if (!parentRow.rows) {
          parentRow.rows = []
        }
        parentRow.rows.push(sectionRow)
      } else {
        // Parent doesn't exist in the list, treat as root
        rootSections.push(sectionRow)
      }
    } else {
      // This is a root-level item
      rootSections.push(sectionRow)
    }
  })

  // Clean up empty rows arrays
  const cleanEmptyRows = (section: SectionItem): SectionItem => {
    if (section.rows && section.rows.length === 0) {
      delete section.rows
    } else if (section.rows) {
      section.rows = section.rows.map(cleanEmptyRows)
    }
    return section
  }

  return rootSections.map(cleanEmptyRows)
}
