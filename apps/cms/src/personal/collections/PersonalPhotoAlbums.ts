import type { CollectionConfig } from 'payload'

import { slugify } from 'payload/shared'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { revalidateWebsiteCollection } from '../../hooks/revalidateWebsite'
import { personalWebsiteGroup, seoField } from '../fields'

/** /photos/tags/<tag> lists the photos with a tag, and /photos/page/<n> is reserved for paging */
const reservedSlugs = new Set(['page', 'tags'])

const albumSlugify = ({ valueToSlugify }: { valueToSlugify?: unknown }) => {
  const slug = slugify(String(valueToSlugify ?? ''))
  return slug && reservedSlugs.has(slug) ? `${slug}-album` : slug
}

const revalidate = revalidateWebsiteCollection()

/**
 * The catalogs of the personal website's photo portfolio: listed on /photos in their order here,
 * each with its photos at /photos/<slug>. The website reads published albums anonymously from
 * `GET /api/personal-photo-albums`; drafts stay private, and so do their photos.
 */
export const PersonalPhotoAlbums: CollectionConfig = {
  slug: 'personal-photo-albums',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'The Photos page shows the albums in the order of this list; drag them to change it.',
    group: personalWebsiteGroup,
    listSearchableFields: ['title', 'slug'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    // What a photo receives about its album
    slug: true,
    title: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'e.g. Street, Landscapes, Japan 2025',
      },
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Shown below the title on the album page, and in search results.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      admin: {
        description: "Shown for the album on the Photos page. Empty: the album's first photo.",
      },
      filterOptions: ({ id }) => (id ? { album: { equals: id } } : true),
      relationTo: 'personal-photos',
    },
    {
      name: 'slug',
      type: 'slug',
      admin: {
        description: 'The album is at /photos/<slug>.',
      },
      slugify: albumSlugify,
      useAsSlug: 'title',
    },
    {
      name: 'photos',
      type: 'join',
      admin: {
        defaultColumns: ['filename', 'title', '_status'],
        description: 'The photos of this album. Set the album of a photo in Photos.',
      },
      collection: 'personal-photos',
      on: 'album',
    },
    seoField,
  ],
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
    beforeChange: [revalidate.beforeChange],
  },
  labels: {
    plural: 'Photo albums',
    singular: 'Photo album',
  },
  orderable: true,
  versions: {
    drafts: true,
  },
}
