import type { Payload } from '../../../types/index.js'

/**
 * Convert to snake_case (matches to-snake-case library behavior)
 * Handles camelCase, PascalCase, and hyphens
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/-/g, '_') // Convert hyphens to underscores
}

export type VersionRecord = {
  _status: 'draft' | 'published'
  created_at?: Date | string
  createdAt?: Date | string
  id: number | string
  parent: number | string
  published_locale?: string
  publishedLocale?: string
  snapshot?: boolean
}

export type VersionLocaleStatusMap = Map<number | string, Map<string, 'draft' | 'published'>>

/**
 * Core logic for calculating the status of each locale for each version
 * by processing version history chronologically.
 *
 * This works by:
 * 1. Processing versions in chronological order (oldest first)
 * 2. Tracking the cumulative published state for each document as we process versions
 * 3. For each version, determining what status each locale should have based on:
 *    - Publish events with publishedLocale: mark that locale as published, version shows NEW state
 *    - Publish events without publishedLocale: mark all locales as published, version shows NEW state
 *    - Draft saves (_status='draft'): mark all locales as draft (unpublish everything)
 *    - Snapshots: preserve state AFTER publish (snapshots created after publishing specific locale)
 *
 * Snapshot creation flow when publishing one locale:
 * 1. Merge incoming content with last published → update main table
 * 2. Create snapshot object (preserves other locales' draft content + updates published locale)
 * 3. Create publish version (_status='published', publishedLocale set)
 * 4. Create snapshot version (_status='draft', snapshot=true)
 *    - Snapshot CONTENT is mixed (draft + published content)
 *    - Snapshot STATUS reflects which locales are actually published
 *
 * Example scenario:
 * - V1: publish all locales (no snapshot) → state: {en: published, es: published, de: published}
 * - V2: draft save → state: {en: draft, es: draft, de: draft}
 * - V3: publish en only → state: {en: published, es: draft, de: draft}
 * - V4: snapshot after publishing en → state: {en: published, es: draft, de: draft}
 * - V5: publish all locales (no snapshot) → state: {en: published, es: published, de: published}
 *
 * @param versions - Array of version records (must be sorted by parent, then createdAt ASC)
 * @param locales - Array of locale codes (e.g., ['en', 'es', 'pt'])
 * @param payload - Payload instance for logging
 * @returns Map of versionId -> Map of locale -> status
 */
export function calculateVersionLocaleStatuses(
  versions: VersionRecord[],
  locales: string[],
  payload: Payload,
): VersionLocaleStatusMap {
  payload.logger.info({ msg: `Processing ${versions.length} version records` })

  // Track the cumulative published state for each document across all locales
  // This represents what IS published at any given point in the version history
  const documentPublishState = new Map<number | string, Map<string, 'draft' | 'published'>>()

  // Map to store the final status for each version
  const versionLocaleStatus: VersionLocaleStatusMap = new Map()

  // Process versions chronologically to build up status history
  for (const version of versions) {
    const versionId = version.id
    const documentId = version.parent
    const status = version._status
    const publishedLocale = version.published_locale || version.publishedLocale
    const isSnapshot = version.snapshot === true

    // Initialize document state if first time seeing this document
    if (!documentPublishState.has(documentId)) {
      const localeMap = new Map<string, 'draft' | 'published'>()
      for (const locale of locales) {
        localeMap.set(locale, 'draft')
      }
      documentPublishState.set(documentId, localeMap)
    }

    const currentPublishState = documentPublishState.get(documentId)!
    const versionStatusMap = new Map<string, 'draft' | 'published'>()

    if (isSnapshot) {
      // Snapshots are created AFTER publishing a specific locale
      // Snapshot CONTENT is mixed: preserves other locales' draft content + new published locale content
      // But snapshot STATUS should reflect publish state: which locales are published vs draft
      // We use currentPublishState to track this, which has been updated by the previous publish
      for (const [locale, publishedStatus] of currentPublishState.entries()) {
        versionStatusMap.set(locale, publishedStatus)
      }
    } else if (status === 'published') {
      // This is a publish event
      if (publishedLocale) {
        // Publishing ONE locale - update the document's published state for that locale
        currentPublishState.set(publishedLocale, 'published')

        // This version should show the NEW state (after this publish)
        for (const [locale, publishedStatus] of currentPublishState.entries()) {
          versionStatusMap.set(locale, publishedStatus)
        }
      } else {
        // Publishing ALL locales - update all locales to published
        for (const locale of locales) {
          currentPublishState.set(locale, 'published')
          versionStatusMap.set(locale, 'published')
        }
      }
    } else {
      // This is a draft save - in the OLD system, _status='draft' meant unpublish ALL locales
      for (const locale of locales) {
        currentPublishState.set(locale, 'draft')
        versionStatusMap.set(locale, 'draft')
      }
    }

    // Store the status for this version
    versionLocaleStatus.set(versionId, versionStatusMap)
  }

  return versionLocaleStatus
}

/**
 * Sorts version records by parent document, then by creation date (oldest first)
 *
 * @param versions - Array of version records
 * @returns Sorted array of version records
 */
export function sortVersionsChronologically(versions: VersionRecord[]): VersionRecord[] {
  return versions.sort((a, b) => {
    // First sort by parent
    const parentA = String(a.parent)
    const parentB = String(b.parent)
    if (parentA !== parentB) {
      return parentA.localeCompare(parentB)
    }

    // Then sort by creation date
    const dateA = new Date(a.created_at || a.createdAt || 0)
    const dateB = new Date(b.created_at || b.createdAt || 0)
    return dateA.getTime() - dateB.getTime()
  })
}
