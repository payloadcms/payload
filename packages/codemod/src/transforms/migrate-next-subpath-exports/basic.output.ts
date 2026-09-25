import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui/rsc'
import { CollectionCards, DefaultNav, DocumentHeader, Logo } from '@payloadcms/ui/rsc'
import { HierarchyTypeField, SlugField } from '@payloadcms/ui'
import type { CollectionConfig } from 'payload'

export const widget = { Component: '@payloadcms/ui/rsc#CollectionCards' }
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
  SlugField,
}
