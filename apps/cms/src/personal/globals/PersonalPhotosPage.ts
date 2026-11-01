import type { GlobalConfig } from 'payload'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import { pageTitleRow, personalWebsiteGroup, richTextField, seoField } from '../fields'

/**
 * The texts of the personal website's Photos page (/photos): an introduction, the featured photos
 * and the albums. The photos and albums themselves are under Photos and Photo albums. Until it's
 * saved, the website uses the defaults in its lib/payload/photos.js.
 */
export const PersonalPhotosPage: GlobalConfig = {
  slug: 'personal-photos-page',
  access: {
    read: () => true,
  },
  admin: {
    description: 'The photos themselves are under Photos, their catalogs under Photo albums.',
    group: personalWebsiteGroup,
  },
  fields: [
    pageTitleRow({ subtitle: 'Moments I captured', title: 'Photography' }),
    richTextField({ name: 'intro', label: 'Introduction' }),
    {
      type: 'row',
      fields: [
        {
          name: 'featuredTitle',
          type: 'text',
          admin: {
            description: 'Above the photos marked Featured, e.g. Featured. Empty: Latest photos.',
          },
        },
        {
          name: 'albumsTitle',
          type: 'text',
          admin: {
            description: 'Above the albums, e.g. Albums',
          },
        },
      ],
    },
    seoField,
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Photos page',
}
