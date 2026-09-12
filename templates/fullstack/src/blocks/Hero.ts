import type { Block } from 'payload'

import { mediaSlug } from '../collections/Media/index.js'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'text' },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaLink', type: 'text', validate: validateLink },
    { name: 'backgroundImage', type: 'upload', relationTo: mediaSlug },
  ],
}

function validateLink(value: unknown): true | string {
  if (typeof value !== 'string' || value.length === 0) return true
  if (/^\/[\w./?#[\]@!$&'()*+,;=%~-]*$/.test(value)) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? true
      : 'Use a relative path or an HTTP(S) URL.'
  } catch {
    return 'Use a relative path or an HTTP(S) URL.'
  }
}
