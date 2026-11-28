import type { CollectionConfig } from 'payload'

export const mediaHeaderOnlyVideoSlug = 'media-header-only-video'
export const mediaVideoAllowListSlug = 'media-video-allow-list'

/** `disableLocalStorage` and no `mimeTypes`, so a client-uploaded MP4 arrives with no contents. */
export const MediaHeaderOnlyVideo: CollectionConfig = {
  slug: mediaHeaderOnlyVideoSlug,
  fields: [],
  upload: { disableLocalStorage: true },
  versions: false,
}

/**
 * The same with `mimeTypes`. A client-uploaded MP4 still arrives with no contents, because its
 * allow-list and content checks run over byte ranges.
 */
export const MediaVideoAllowList: CollectionConfig = {
  slug: mediaVideoAllowListSlug,
  fields: [],
  upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
  versions: false,
}
