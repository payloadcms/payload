import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui/rsc'
import { CollectionCards, DefaultNav, DocumentHeader, Logo } from '@payloadcms/ui/rsc'
import {
  HierarchyTypeField,
  SlugField,
} from '@payloadcms/ui'
import type { CollectionConfig } from 'payload'
import { DefaultNavClient, NavWrapper, QueryPresetsWhereField } from '@payloadcms/ui/internal'

export const widget = { Component: '@payloadcms/ui/rsc#CollectionCards' }
export const queryPresetField = '@payloadcms/ui/internal#QueryPresetsWhereField'
export const slug: CollectionConfig['fields'][number] = {
  name: 'slug',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '@payloadcms/ui#SlugField',
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
