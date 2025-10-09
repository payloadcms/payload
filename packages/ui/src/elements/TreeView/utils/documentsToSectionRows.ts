import type { TreeViewItem } from 'payload/shared'

import type { SectionRow } from '../NestedSectionsTable/index.js'

type Args = {
  i18nLanguage: string
  items: TreeViewItem[]
}

export function itemsToSectionRows({ i18nLanguage, items }: Args): SectionRow[] {
  // Create a map for quick lookups
  const itemMap = new Map<number | string, TreeViewItem>()
  items.forEach((item) => {
    itemMap.set(item.value.id, item)
  })

  // Create a map to store section rows
  const sectionRowMap = new Map<number | string, SectionRow>()

  // Convert each item to a SectionRow
  items.forEach((item) => {
    const sectionRow: SectionRow = {
      name: item.value.title,
      hasChildren: item.hasChildren,
      rowID: item.value.id,
      rows: [],
      updatedAt: item.value.updatedAt
        ? new Date(item.value.updatedAt).toLocaleDateString(i18nLanguage, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
    }
    sectionRowMap.set(item.value.id, sectionRow)
  })

  // Build the hierarchy
  const rootSections: SectionRow[] = []

  items.forEach((item) => {
    const sectionRow = sectionRowMap.get(item.value.id)
    if (!sectionRow) {
      return
    }

    if (item.value.parentID) {
      // This is a child - add it to its parent's rows array
      const parentRow = sectionRowMap.get(item.value.parentID)
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
  const cleanEmptyRows = (section: SectionRow): SectionRow => {
    if (section.rows && section.rows.length === 0) {
      delete section.rows
    } else if (section.rows) {
      section.rows = section.rows.map(cleanEmptyRows)
    }
    return section
  }

  return rootSections.map(cleanEmptyRows)
}
