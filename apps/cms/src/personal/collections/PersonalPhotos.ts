import type { CollectionConfig, ImageSize } from 'payload'

import { slugify } from 'payload/shared'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { revalidateWebsiteCollection } from '../../hooks/revalidateWebsite'
import { normalizeTags, personalWebsiteGroup } from '../fields'
import { isPhotoAIEnabled } from '../photos/describePhoto'
import { fillFromFile } from '../photos/fillFromFile'
import { generateTextEndpoint } from '../photos/generateTextEndpoint'

/**
 * Sizes made from every photo for the website, which picks the one that fits the screen. Registered
 * on the Sharp transformer in src/payload.config.ts and returned under `variants.<name>`.
 */
export const photoVariants: ImageSize[] = [480, 960, 1600, 2560].map((maxSide) => ({
  name: `max${maxSide}`,
  fit: 'inside',
  height: maxSide,
  width: maxSide,
  withoutEnlargement: true,
}))

/** Album and photo pages are /photos/<album>/<photo>, so a photo can't use the paging segment */
const photoSlugify = ({ valueToSlugify }: { valueToSlugify?: unknown }) => {
  const slug = slugify(String(valueToSlugify ?? ''))
  return slug === 'page' ? 'page-photo' : slug
}

const revalidate = revalidateWebsiteCollection({
  // The website also needs the albums: a photo is at /photos/<album>/<photo>
  extraBody: async ({ docs, req }) => {
    const ids = docs.map((doc) => doc.album).filter(Boolean)
    const slugs = await Promise.all(
      ids.map(async (album) => {
        if (typeof album === 'object' && album && 'slug' in album) return album.slug
        const doc = await req.payload
          .findByID({
            id: String(album),
            collection: 'personal-photo-albums',
            depth: 0,
            disableErrors: true,
            overrideAccess: true,
            select: { slug: true },
          })
          .catch(() => null)
        return doc?.slug
      }),
    )

    return { albums: [...new Set(slugs.filter(Boolean))] }
  },
})

/**
 * Photos of the personal website's portfolio (/photos). Each photo is one upload, stored in S3 like
 * Media (src/storage/s3.ts) with its sizes, and belongs to one album (Photo albums). Its page is
 * /photos/<album>/<slug>. The website reads published photos anonymously from
 * `GET /api/personal-photos`; drafts stay private.
 *
 * The file is stored without its metadata, such as the GPS location most phones record, and at
 * most 4096 px on its longer side (photos/fillFromFile.ts).
 */
export const PersonalPhotos: CollectionConfig = {
  slug: 'personal-photos',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['filename', 'title', 'album', '_status', 'updatedAt'],
    // The same with or without OPENAI_API_KEY, so the generated types don't depend on the .env
    description:
      'Drop in many photos at once with Bulk upload. With OPENAI_API_KEY set, empty titles, alt texts, descriptions and tags are written by AI on upload; review them before you publish.',
    group: personalWebsiteGroup,
    listSearchableFields: ['title', 'filename', 'description', 'tags'],
    useAsTitle: 'title',
  },
  defaultSort: '_order',
  endpoints: [generateTextEndpoint],
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: "Shown on the photo's page and in search results.",
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'What the photo shows, in one sentence, for screen readers and image search. Not shown on the page.',
      },
      label: 'Alt text',
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Shown below the photo on its page, and in search results and link previews.',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: "Optional, e.g. Kyoto, Japan. Shown on the photo's page; AI uses it too.",
      },
    },
    {
      name: 'camera',
      type: 'group',
      admin: {
        description:
          "Read from the file on upload when the camera recorded them. Shown on the photo's page.",
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'model', type: 'text', label: 'Camera' },
            { name: 'lens', type: 'text' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'focalLength', type: 'text', admin: { placeholder: '35 mm' } },
            { name: 'aperture', type: 'text', admin: { placeholder: 'f/1.8' } },
            { name: 'shutterSpeed', type: 'text', admin: { placeholder: '1/250 s' } },
            { name: 'iso', type: 'text', admin: { placeholder: 'ISO 100' }, label: 'ISO' },
          ],
        },
      ],
      label: 'Camera',
    },
    {
      name: 'generateText',
      type: 'ui',
      admin: {
        components: {
          Field: {
            clientProps: { enabled: isPhotoAIEnabled },
            path: '/components/PhotoTextButton#PhotoTextButton',
          },
        },
        position: 'sidebar',
      },
    },
    {
      name: 'album',
      type: 'relationship',
      admin: {
        description:
          'Bulk upload: set it for all photos at once with "Edit all", then choose Album.',
        position: 'sidebar',
      },
      relationTo: 'personal-photo-albums',
      required: true,
    },
    {
      name: 'tags',
      type: 'text',
      admin: {
        description: 'Shown as links to every photo with the same tag.',
        position: 'sidebar',
      },
      hasMany: true,
      hooks: {
        beforeChange: [normalizeTags],
      },
    },
    {
      name: 'slug',
      type: 'slug',
      admin: {
        description: 'The photo is at /photos/<album>/<slug>.',
      },
      slugify: photoSlugify,
      useAsSlug: 'title',
    },
    {
      name: 'takenAt',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'd MMM yyyy',
          pickerAppearance: 'dayOnly',
        },
        description: 'Read from the file when the camera recorded it.',
        position: 'sidebar',
      },
      label: 'Taken on',
    },
    {
      name: 'featured',
      type: 'checkbox',
      admin: {
        description: 'Show it on the Photos page (/photos).',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
    beforeChange: [revalidate.beforeChange],
    beforeOperation: [fillFromFile],
  },
  labels: {
    plural: 'Photos',
    singular: 'Photo',
  },
  // Drag photos into the order the albums show them in
  orderable: true,
  upload: {
    adminThumbnail: 'max480',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    // Used only when S3 storage is off (src/storage/s3.ts), next to the Media files
    staticDir: `${process.env.MEDIA_DIR || 'media'}/photos`,
  },
  versions: {
    drafts: true,
  },
}
