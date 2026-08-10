import type { Block } from 'payload'

export const ctaBlock: Block = {
  slug: 'cta-block',
  labels: {
    plural: 'CTA Blocks',
    singular: 'CTA Block',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
    },
  ],
}

export const heroBlock: Block = {
  slug: 'hero-block',
  labels: {
    plural: 'Hero Sections',
    singular: 'Hero Section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'subheading',
      type: 'text',
    },
  ],
}

export const mediaBlock: Block = {
  slug: 'media-block',
  labels: {
    plural: 'Media Blocks',
    singular: 'Media Block',
  },
  fields: [
    {
      name: 'caption',
      type: 'text',
    },
  ],
}

export const quoteBlock: Block = {
  slug: 'quote-block',
  labels: {
    plural: 'Quotes',
    singular: 'Quote',
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
    },
  ],
}

export const contentBlock: Block = {
  slug: 'content-block',
  labels: {
    plural: 'Content Blocks',
    singular: 'Content Block',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
    },
  ],
}

export const galleryBlock: Block = {
  slug: 'gallery-block',
  labels: {
    plural: 'Galleries',
    singular: 'Gallery',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export const accordionBlock: Block = {
  slug: 'accordion-block',
  labels: {
    plural: 'Accordions',
    singular: 'Accordion',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
}

export const videoBlock: Block = {
  slug: 'video-block',
  labels: {
    plural: 'Video Embeds',
    singular: 'Video Embed',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
    },
  ],
}

export const codeBlock: Block = {
  slug: 'code-block',
  labels: {
    plural: 'Code Snippets',
    singular: 'Code Snippet',
  },
  fields: [
    {
      name: 'language',
      type: 'text',
    },
    {
      name: 'code',
      type: 'code',
    },
  ],
}

export const tableBlock: Block = {
  slug: 'table-block',
  labels: {
    plural: 'Tables',
    singular: 'Table',
  },
  fields: [
    {
      name: 'caption',
      type: 'text',
    },
  ],
}

export const drawerBlocks: Block[] = [
  ctaBlock,
  heroBlock,
  mediaBlock,
  quoteBlock,
  contentBlock,
  galleryBlock,
  accordionBlock,
  videoBlock,
  codeBlock,
  tableBlock,
]
