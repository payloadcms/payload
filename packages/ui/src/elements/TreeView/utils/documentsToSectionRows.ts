import type { TreeViewDocument } from 'payload/shared'

import type { SectionRow } from '../NestedSectionsTable/index.js'

type Args = {
  documents: TreeViewDocument[]
  i18nLanguage: string
}

export function documentsToSectionRows({ documents, i18nLanguage }: Args): SectionRow[] {
  // Create a map for quick lookups
  const docMap = new Map<number | string, TreeViewDocument>()
  documents.forEach((doc) => {
    docMap.set(doc.value.id, doc)
  })

  // Create a map to store section rows
  const sectionRowMap = new Map<number | string, SectionRow>()

  // Convert each document to a SectionRow
  documents.forEach((doc) => {
    const sectionRow: SectionRow = {
      name: doc.value.title,
      rowID: doc.value.id,
      rows: [],
      updatedAt: doc.value.updatedAt
        ? new Date(doc.value.updatedAt).toLocaleDateString(i18nLanguage, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
    }
    sectionRowMap.set(doc.value.id, sectionRow)
  })

  // Build the hierarchy
  const rootSections: SectionRow[] = []

  documents.forEach((doc) => {
    const sectionRow = sectionRowMap.get(doc.value.id)
    if (!sectionRow) {
      return
    }

    if (doc.value.parentID) {
      // This is a child - add it to its parent's rows array
      const parentRow = sectionRowMap.get(doc.value.parentID)
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
      // This is a root-level document
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
