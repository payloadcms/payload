import type { TFunction } from '@payloadcms/translations'
import type { Pill } from '@payloadcms/ui'

type Args = {
  currentDoc?: {
    id: number | string
    updatedAt: string
  }
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
  t: TFunction
  version: {
    id: number | string
    version: { _status?: string; updatedAt?: string }
  }
}

/**
 * Gets the appropriate version label and version pill styling
 * given existing versions and the current version status.
 */
export function getVersionLabel({ currentDoc, latestDraftVersion, t, version }: Args): {
  label: string
  name: 'currentDraft' | 'currentlyPublished' | 'draft' | 'previouslyPublished' | 'published'
  pillStyle: Parameters<typeof Pill>[0]['pillStyle']
} {
  const publishedNewerThanDraft = currentDoc?.updatedAt > latestDraftVersion?.updatedAt

  if (version?.version?._status === 'draft') {
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
    const isCurrentlyPublished = version?.version?.updatedAt === currentDoc?.updatedAt
    return {
      name: isCurrentlyPublished ? 'currentlyPublished' : 'previouslyPublished',
      label: isCurrentlyPublished
        ? t('version:currentlyPublished')
        : t('version:previouslyPublished'),
      pillStyle: isCurrentlyPublished ? 'success' : 'light',
    }
  }
}
