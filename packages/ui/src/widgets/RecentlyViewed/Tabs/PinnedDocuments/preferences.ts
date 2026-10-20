import type { PinnedDocumentsPreferences } from 'payload'

import type { PinnedItem } from '../../recents.js'

import { documentKey, getPinnedItems } from '../../recents.js'

export async function readPinnedPreferences({ url }: { url: string }): Promise<PinnedItem[]> {
  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('Unable to read pins')
  }
  const preference: { value?: unknown } = await response.json()

  return getPinnedItems({ value: preference.value })
}

/** Serialize the read/modify/write operation across same-origin admin tabs. */
export async function updatePinnedPreferences({
  document,
  shouldPin,
  url,
}: {
  document: PinnedItem
  shouldPin: boolean
  url: string
}): Promise<void> {
  const update = async () => {
    const existing = await readPinnedPreferences({ url })

    if (shouldPin && existing.some((item) => documentKey(item) === documentKey(document))) {
      return
    }
    const remaining = existing.filter((item) => documentKey(item) !== documentKey(document))
    const items = shouldPin ? [document, ...remaining] : remaining

    await savePinnedPreferences({ items, url })
  }

  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request(`payload:pinned-documents:${url}`, update)
  } else {
    await update()
  }
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
