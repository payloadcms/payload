import type { CollectionBeforeChangeHook, CollectionConfig, FieldHook } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical'
import { ValidationError } from 'payload'
import { slugify } from 'payload/shared'

import type { Page } from '../payload-types'

import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { Code } from '../blocks/Code'
import { YouTube } from '../blocks/YouTube'
import { revalidateWebsiteCollection } from '../hooks/revalidateWebsite'
import { sites } from '../sites'

/** "About Me!" → "about-me": derived from the title while empty, normalized when typed */
function fillSlug({ data, value }: Parameters<FieldHook<Page>>[0]) {
  const slug = typeof value === 'string' && value.trim() ? value : data?.title
  return typeof slug === 'string' ? slugify(slug) || undefined : value
}

/**
 * Rejects a slug that another page already uses on one of the same sites. Runs for drafts too,
 * which skip field validation, so the editor sees the problem before publishing.
 */
const preventDuplicateSlugs: CollectionBeforeChangeHook<Page> = async ({
  data,
  originalDoc,
  req,
}) => {
  const slug = data.slug ?? originalDoc?.slug
  const pageSites = data.sites ?? originalDoc?.sites

  if (!slug || !pageSites?.length) {
    return data
  }

  const { docs } = await req.payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: { sites: true },
    where: {
      and: [
        { slug: { equals: slug } },
        { sites: { in: pageSites } },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
  })

  if (docs[0]) {
    const taken = pageSites
      .filter((site) => docs[0].sites?.includes(site))
      .map((site) => sites.find((option) => option.value === site)?.label ?? site)

    throw new ValidationError(
      {
        collection: 'pages',
        errors: [
          {
            message: `Another page already uses "${slug}" on ${taken.join(', ')}.`,
            path: 'slug',
          },
        ],
      },
      req.t,
    )
  }

  return data
}

// The personal website shows its pages at /<slug> and rebuilds them when they change
const revalidatePersonalWebsite = revalidateWebsiteCollection({
  isOnWebsite: (page) => Boolean(page.sites?.includes('personal')),
})

/**
 * Standalone pages such as "About", "Services" or "Privacy policy" for every website and app in
 * src/sites.ts, read through `GET /api/pages`.
 *
 * Each site asks only for its own pages:
 * `GET /api/pages?where[sites][in]=business&where[slug][equals]=about`.
 * A page can belong to several sites, e.g. one privacy policy for the business website and the iOS
 * app. Slugs are unique per site, so every site can have its own "about" page.
 * Only published pages are visible without logging in.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'sites', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    // What a document that links to this page receives
    slug: true,
    sites: true,
    title: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'One or two sentences for search results and link previews.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures.filter((feature) => feature.key !== 'relationship'),
          // The page title is the page's h1
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          LinkFeature({ enabledCollections: ['pages', 'posts'] }),
          BlocksFeature({ blocks: [Code, YouTube] }),
          FixedToolbarFeature(),
        ],
      }),
      required: true,
    },
    {
      name: 'sites',
      type: 'select',
      admin: {
        description: 'The websites and apps that show this page.',
        position: 'sidebar',
      },
      hasMany: true,
      index: true,
      options: sites.map(({ label, value }) => ({ label, value })),
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description:
          'Identifies the page within each site, e.g. "about" for /about. Filled in from the title when left empty.',
        position: 'sidebar',
      },
      hooks: {
        beforeDuplicate: [({ value }) => (value ? `${value}-copy` : value)],
        beforeValidate: [fillSlug],
      },
      index: true,
      // Filled in from the title before validation, so it's never empty when saved
      required: true,
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description:
          'Optional. Overrides the title and description shown by search engines and link previews.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
      label: 'SEO',
    },
  ],
  hooks: {
    afterChange: [revalidatePersonalWebsite.afterChange],
    afterDelete: [revalidatePersonalWebsite.afterDelete],
    beforeChange: [preventDuplicateSlugs, revalidatePersonalWebsite.beforeChange],
  },
  // Backstop for the check in preventDuplicateSlugs: one slug per site
  indexes: [{ fields: ['sites', 'slug'], unique: true }],
  versions: {
    drafts: true,
  },
}
