import type { CollectionConfig } from 'payload/types'

import { loggedIn } from '../../access/loggedIn'
import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { serverUrl } from '../../app/_utils/api'
import { Content } from '../../blocks/Content'
import { Form } from '../../blocks/Form'
import { MediaBlock } from '../../blocks/Media'
import { MediaContent } from '../../blocks/MediaContent'
import { ProfileCTA } from '../../blocks/ProfileCTA'
import { ProjectGrid } from '../../blocks/ProjectGrid'
import formatSlug from '../../utilities/formatSlug'
import { tagRevalidator } from '../../utilities/tagRevalidator'

const formatAppURL = ({ doc }): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug
  const { pathname } = new URL(`${serverUrl}/${pathToUse}`)
  return pathname
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    preview: doc => {
      return `${serverUrl}${formatAppURL({ doc })}?preview=true`
    },
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrLoggedIn,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: {
    afterChange: [tagRevalidator(doc => `pages/${doc.slug}`)],
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      label: 'Content',
      type: 'blocks',
      blocks: [Content, Form, MediaBlock, MediaContent, ProfileCTA, ProjectGrid],
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [formatSlug('title')],
      },
    },
  ],
}

export default Pages
