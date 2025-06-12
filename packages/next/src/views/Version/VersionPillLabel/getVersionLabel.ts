import type { TFunction } from '@payloadcms/translations'
import type { Pill } from '@payloadcms/ui'

type Args = {
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  latestPublishedVersion?: {
    id: number | string
    updatedAt: string
  }
  t: TFunction
  version: {
    id: number | string
    version: { _status?: string }
  }
}

/**
 * Gets the appropriate version label and version pill styling
 * given existing versions and the current version status.
 */
export function getVersionLabel({ latestDraftVersion, latestPublishedVersion, t, version }: Args): {
  label: string
  name: 'currentDraft' | 'currentlyPublished' | 'draft' | 'previouslyPublished' | 'published'
  pillStyle: Parameters<typeof Pill>[0]['pillStyle']
} {
  const publishedNewerThanDraft = latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  if (version.version._status === 'draft') {
    if (publishedNewerThanDraft) {
      return {
        name: 'draft',
        label: t('version:draft'),
        pillStyle: 'light',
      }
    } else {
      return {
        name: version.id === latestDraftVersion?.id ? 'currentDraft' : 'draft',
        label:
          version.id === latestDraftVersion?.id ? t('version:currentDraft') : t('version:draft'),
        pillStyle: 'light',
      }
    }
  } else {
    const isCurrentlyPublished = version.id === latestPublishedVersion?.id
    return {
      name: isCurrentlyPublished ? 'currentlyPublished' : 'previouslyPublished',
      label: isCurrentlyPublished
        ? t('version:currentlyPublished')
        : t('version:previouslyPublished'),
      pillStyle: isCurrentlyPublished ? 'success' : 'light',
    }
  }
}
