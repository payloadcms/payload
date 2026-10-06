import type { PinnedDocumentsPreferences } from 'payload'

import type { PinnedItem } from './recents.js'

import { documentKey } from './recents.js'

export function getPinnedItems({ value }: { value: unknown }): PinnedItem[] {
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items)) {
    return []
  }
  const keys = new Set<string>()

  return value.items.filter((item): item is PinnedItem => {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.collectionSlug !== 'string' ||
      (typeof item.id !== 'string' && typeof item.id !== 'number')
    ) {
      return false
    }
    const key = documentKey(item)

    if (keys.has(key)) {
      return false
    }
    keys.add(key)
    return true
  })
}

export async function readPinnedPreferences({ url }: { url: string }): Promise<PinnedItem[]> {
  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('Unable to read pins')
  }
  const preference: { value?: unknown } = await response.json()

  return getPinnedItems({ value: preference.value })
}

export async function savePinnedPreferences({
  items,
  url,
}: {
  items: PinnedItem[]
  url: string
}): Promise<void> {
  const response = await fetch(url, {
    body: JSON.stringify({ value: { items } satisfies PinnedDocumentsPreferences }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to save pins')
  }
}
