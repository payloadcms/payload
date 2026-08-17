import { DefaultTemplate, MinimalTemplate } from '@payloadcms/next/templates'
import { CollectionCards, DefaultNav, DocumentHeader, Logo } from '@payloadcms/next/rsc'
import {
  DefaultNavClient,
  HierarchyTypeField,
  NavWrapper,
  QueryPresetsWhereField,
  SlugField,
} from '@payloadcms/next/client'
import type { CollectionConfig } from 'payload'

export const widget = { Component: '@payloadcms/next/rsc#CollectionCards' }
export const queryPresetField = '@payloadcms/next/client#QueryPresetsWhereField'
export const slug: CollectionConfig['fields'][number] = {
  name: 'slug',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '@payloadcms/next/client#SlugField',
      },
    },
  },
}

export {
  DefaultTemplate,
  MinimalTemplate,
  CollectionCards,
  DefaultNav,
  DocumentHeader,
  Logo,
  HierarchyTypeField,
  DefaultNavClient,
  NavWrapper,
  QueryPresetsWhereField,
  SlugField,
}
