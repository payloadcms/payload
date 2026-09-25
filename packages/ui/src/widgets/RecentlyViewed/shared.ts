export type DocumentIdentity = { collectionSlug: string; id: number | string }
export type DocumentWidgetPreferences = {
  pins: DocumentIdentity[]
  tab: 'drafts' | 'pinned' | 'recent'
  view: 'grid' | 'list'
}
export type DashboardDocument = {
  href: string
  status?: 'changed' | 'draft' | 'published'
  thumbnailURL?: string
  title: string
  typeLabel: string
  updatedAt?: string
  updatedBy?: string
  viewedAt?: string
} & DocumentIdentity
export type DocumentWidgetData = {
  documents: DashboardDocument[]
  draftKeys: string[]
  hasError: boolean
  preferences: DocumentWidgetPreferences
  recentKeys: string[]
}
export const documentKey = ({ id, collectionSlug }: DocumentIdentity): string =>
  `${collectionSlug}:${id}`

export const normalizeDocumentPreferences = ({
  value,
}: {
  value: unknown
}): DocumentWidgetPreferences => {
  const data =
    value && typeof value === 'object' ? (value as Partial<DocumentWidgetPreferences>) : {}
  const seen = new Set<string>()
  const pins = (Array.isArray(data.pins) ? data.pins : [])
    .filter((pin) => {
      if (
        !pin ||
        typeof pin.collectionSlug !== 'string' ||
        !['number', 'string'].includes(typeof pin.id)
      ) {
        return false
      }
      const key = documentKey(pin)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .map(({ id, collectionSlug }) => ({ id, collectionSlug }))
  return {
    pins,
    tab: data.tab === 'pinned' || data.tab === 'drafts' ? data.tab : 'recent',
    view: data.view === 'list' ? 'list' : 'grid',
  }
}

export const toggleDocumentPin = ({
  document,
  pins,
}: {
  document: DocumentIdentity
  pins: DocumentIdentity[]
}): DocumentIdentity[] => {
  const key = documentKey(document)
  return pins.some((pin) => documentKey(pin) === key)
    ? pins.filter((pin) => documentKey(pin) !== key)
    : [{ id: document.id, collectionSlug: document.collectionSlug }, ...pins]
}

export const getActivityDocuments = ({
  documents,
  draftKeys,
  isAscending = false,
  preferences,
  recentKeys,
}: { isAscending?: boolean } & DocumentWidgetData): DashboardDocument[] => {
  const { pins, tab, view } = preferences
  const activeKeys =
    tab === 'pinned' ? pins.map(documentKey) : tab === 'recent' ? recentKeys : draftKeys
  const byKey = new Map(documents.map((doc) => [documentKey(doc), doc]))
  const matchingDocuments = [...new Set(activeKeys)].flatMap((key) => {
    const doc = byKey.get(key)
    return doc ? [doc] : []
  })
  const items = tab === 'recent' ? matchingDocuments.slice(0, 8) : matchingDocuments

  if (tab === 'drafts' || view === 'list') {
    items.sort((a, b) => {
      const difference = (Date.parse(a.updatedAt || '') || 0) - (Date.parse(b.updatedAt || '') || 0)
      return isAscending ? difference : -difference
    })
  }
  return tab === 'drafts' ? items.slice(0, 8) : items
}
