'use client'

import type { CollectionPreferences } from 'payload'

import { useEffect } from 'react'

import { usePreferences } from '../../providers/Preferences/index.js'

type Props = {
  collectionSlug: string
  preferences: CollectionPreferences
}

export function HydratePreferences({ collectionSlug, preferences }: Props) {
  const { syncPreference } = usePreferences()

  useEffect(() => {
    syncPreference<CollectionPreferences>(`collection-${collectionSlug}`, preferences)
  }, [collectionSlug, preferences, syncPreference])

  return null
}
