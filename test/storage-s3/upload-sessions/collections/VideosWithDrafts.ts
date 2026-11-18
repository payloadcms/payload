import type { CollectionConfig, TextFieldSingleValidation } from 'payload'

import { text } from 'payload/shared'

import { videosWithDraftsSlug } from '../../shared.js'
import { Videos } from './Videos.js'

export const draftOnlyTitlePrefix = 'Draft:'

/** Valid only while the document stays a draft, so a test can tell which status was validated. */
const validateTitle: TextFieldSingleValidation = (value, options) => {
  const { _status } = (options.siblingData ?? {}) as { _status?: string }

  if (_status === 'published' && value?.startsWith(draftOnlyTitlePrefix)) {
    return `Remove "${draftOnlyTitlePrefix}" from the title before publishing.`
  }

  return text(value, options)
}

export const VideosWithDrafts: CollectionConfig = {
  ...Videos,
  slug: videosWithDraftsSlug,
  fields: [{ name: 'title', type: 'text', required: true, validate: validateTitle }],
  versions: { drafts: true },
}
