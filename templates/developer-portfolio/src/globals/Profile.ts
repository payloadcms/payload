import type { GlobalConfig } from 'payload/types'

import { loggedIn } from '../access/loggedIn'
import { tagRevalidator } from '../utilities/tagRevalidator'

export const Profile: GlobalConfig = {
  slug: 'profile',
  access: {
    read: () => true,
    update: loggedIn,
  },
  hooks: {
    afterChange: [tagRevalidator(() => 'global.profile')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'aboutMe',
      type: 'richText',
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        {
          name: 'github',
          label: 'GitHub',
          type: 'text',
        },
        {
          name: 'linkedin',
          label: 'LinkedIn',
          type: 'text',
        },
        {
          name: 'email',
          label: 'Email',
          type: 'text',
        },
        {
          name: 'twitter',
          label: 'Twitter',
          type: 'text',
        },
      ],
    },
  ],
}
