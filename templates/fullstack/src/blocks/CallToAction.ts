import type { Block } from 'payload'

export const CallToActionBlock: Block = {
  slug: 'callToAction',
  interfaceName: 'CallToActionBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'buttonText', type: 'text', required: true },
    { name: 'buttonLink', type: 'text', required: true, validate: validateLink },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Dark Carbon', value: 'dark' },
        { label: 'Light Accent', value: 'light' },
        { label: 'Brand Gradient', value: 'gradient' },
      ],
    },
  ],
}

function validateLink(value: unknown): true | string {
  if (typeof value !== 'string' || value.length === 0) return 'A valid link is required.'
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
