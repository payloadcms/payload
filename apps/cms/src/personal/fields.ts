import type { Field, FieldHook, TextFieldSingleValidation } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical'

import { Code } from '../blocks/Code'
import { YouTube } from '../blocks/YouTube'

/** Where the personal website's content is listed in the admin panel */
export const personalWebsiteGroup = 'Personal website'

/**
 * Rich text on the personal website's pages and projects. The website renders it with the same
 * components as its Markdown (components/RichText.jsx in the website repo).
 */
export const personalEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    // The website has nothing to render for embedded documents
    ...rootFeatures.filter((feature) => feature.key !== 'relationship'),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
    // On the website, posts are at /blog/<slug>, projects at /projects/<slug> and pages at /<slug>
    LinkFeature({ enabledCollections: ['pages', 'posts', 'personal-projects'] }),
    BlocksFeature({ blocks: [Code, YouTube] }),
    FixedToolbarFeature(),
  ],
})

export const richTextField = ({
  name,
  description,
  label,
  required,
}: {
  description?: string
  label?: string
  name: string
  required?: boolean
}): Field => ({
  name,
  type: 'richText',
  admin: description ? { description } : undefined,
  editor: personalEditor,
  label,
  required,
})

/** The heading of a page: a title, and below it a subtitle in the theme's colors */
export const pageTitleRow = ({ subtitle, title }: { subtitle: string; title: string }): Field => ({
  type: 'row',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: `e.g. ${title}`,
      },
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        description: `Shown below the title in color, e.g. ${subtitle}`,
      },
    },
  ],
})

/** A path on the website (/contact), a full URL, an email or phone link, or an anchor (#form) */
export const isLink = (value: string) =>
  /^(?:\/(?!\/)\S*|https?:\/\/\S+|mailto:\S+|tel:\S+|#\S*)$/.test(value)

const validateButtonLink: TextFieldSingleValidation = (value, { siblingData }) => {
  const { file, label } = (siblingData ?? {}) as { file?: unknown; label?: null | string }

  if (value && !isLink(value)) {
    return 'Use a page of the website such as /contact, or a full URL such as https://…'
  }

  if (label && !value && !file) {
    return 'Add a link or a file for the button, or remove its text.'
  }

  return true
}

/** A button: its text, and a link or a file to download */
export const buttonField = ({
  name = 'button',
  description,
  label,
}: {
  description?: string
  label?: string
  name?: string
} = {}): Field => ({
  name,
  type: 'group',
  admin: description ? { description } : undefined,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'The button text. Leave empty to hide the button.',
          },
        },
        {
          name: 'link',
          type: 'text',
          admin: {
            description: 'A page of the website, e.g. /contact, or a full URL.',
          },
          validate: validateButtonLink,
        },
      ],
    },
    {
      name: 'file',
      type: 'upload',
      admin: {
        description: 'Optional. The button opens this file instead of the link, e.g. your resume.',
      },
      relationTo: 'media',
    },
  ],
  label,
})

/** An icon that the website shows inline, so it takes the theme's colors */
export const iconField = ({
  name = 'icon',
  description = 'An SVG file. The website colors it to match the theme.',
  required,
}: {
  description?: string
  name?: string
  required?: boolean
} = {}): Field => ({
  name,
  type: 'upload',
  admin: {
    description,
  },
  filterOptions: {
    mimeType: { equals: 'image/svg+xml' },
  },
  relationTo: 'media',
  required,
})

/** Lines that the website types out one after another, e.g. job titles */
export const typedLinesField = ({
  name,
  description,
  label,
}: {
  description: string
  label?: string
  name: string
}): Field => ({
  name,
  type: 'text',
  admin: {
    description,
  },
  hasMany: true,
  label,
})

export const seoField: Field = {
  name: 'seo',
  type: 'group',
  admin: {
    description:
      'Title and description for search engines and link previews. Empty fields use the defaults from Site settings.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'The browser tab shows it in the Site settings title template, e.g. "Oskar Wong | <title>".',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      admin: {
        description: 'Shown in link previews, e.g. on LinkedIn or X.',
      },
      relationTo: 'media',
    },
  ],
  label: 'SEO',
}

/** Stores tags in the form the website uses for its tag pages: "Next.js" -> "next-js" */
export const normalizeTags: FieldHook = ({ value }) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((tag) =>
              String(tag)
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, '-')
                .replace(/^-|-$/g, ''),
            )
            .filter(Boolean),
        ),
      ]
    : value
