import type { PinnedDocumentsPreferences } from 'payload'

import type { DocumentReference } from '../../utils/documents.js'

import { documentKey, getDocumentReferences } from '../../utils/documents.js'

export async function readPinnedPreferences({
  url,
}: {
  url: string
}): Promise<DocumentReference[]> {
  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('Unable to read pins')
  }
  const preference: { value?: unknown } = await response.json()

  return getDocumentReferences({ value: preference.value })
}

/** Serialize the read/modify/write operation across same-origin admin tabs. */
export async function updatePinnedPreferences({
  document,
  shouldPin,
  url,
}: {
  document: DocumentReference
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
  items: DocumentReference[]
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
