import type { CollectionConfig } from 'payload'

import { Archive } from '@/blocks/ArchiveBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { FormBlock } from '@/blocks/Form/config'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const ReusableContent: CollectionConfig = {
  slug: 'reusable-content',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blockReferences: [CallToAction, Content, Archive, MediaBlock, FormBlock],
      blocks: [],
      required: true,
    },
  ],
}
