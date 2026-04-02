import type { TFunction } from '@payloadcms/translations'
import type { Pill } from '@payloadcms/ui'

type Args = {
  currentLocale?: string
  currentlyPublishedVersion?: {
    id: number | string
    publishedLocale?: string
    updatedAt: string
    version: {
      updatedAt: string
    }
  }
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  t: TFunction
  version: {
    id: number | string
    publishedLocale?: string
    version: { _status?: 'draft' | 'published'; updatedAt: string }
  }
}

/**
 * Gets the appropriate version label and version pill styling
 * given existing versions and the current version status.
 */
export function getVersionLabel({
  currentLocale,
  currentlyPublishedVersion,
  latestDraftVersion,
  t,
  version,
}: Args): {
  label: string
  name: 'currentDraft' | 'currentlyPublished' | 'draft' | 'previouslyPublished' | 'published'
  pillStyle: Parameters<typeof Pill>[0]['pillStyle']
} {
  const status = version.version._status

  if (status === 'draft') {
    const publishedNewerThanDraft =
      currentlyPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

    if (publishedNewerThanDraft) {
      return {
        name: 'draft',
        label: t('version:draft'),
        pillStyle: 'light',
      }
    }

    const isCurrentDraft = version.id === latestDraftVersion?.id

    return {
      name: isCurrentDraft ? 'currentDraft' : 'draft',
      label: isCurrentDraft ? t('version:currentDraft') : t('version:draft'),
      pillStyle: 'light',
    }
  }

  const publishedInAnotherLocale =
    status === 'published' && version.publishedLocale && currentLocale !== version.publishedLocale

  if (publishedInAnotherLocale) {
    return {
      name: 'currentDraft',
      label: t('version:currentDraft'),
      pillStyle: 'light',
    }
  }

  const isCurrentlyPublished =
    currentlyPublishedVersion && version.id === currentlyPublishedVersion.id

  return {
    name: isCurrentlyPublished ? 'currentlyPublished' : 'previouslyPublished',
    label: isCurrentlyPublished
      ? t('version:currentlyPublished')
      : t('version:previouslyPublished'),
    pillStyle: isCurrentlyPublished ? 'success' : 'light',
  }
}
