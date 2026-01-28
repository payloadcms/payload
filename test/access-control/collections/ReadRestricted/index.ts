import type { CollectionConfig } from 'payload'

import { unrestrictedSlug } from '../../shared.js'

export const readRestrictedSlug = 'read-restricted'

export const ReadRestricted: CollectionConfig = {
  slug: readRestrictedSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    groupBy: true,
    defaultColumns: [
      'restrictedTopLevel',
      'visibleTopLevel',
      'contactInfo.secretPhone',
      'contactInfo.publicPhone',
      'settings.restrictedSetting',
    ],
  },
  fields: [
    // Top-level restricted field
    {
      name: 'restrictedTopLevel',
      type: 'text',
      access: {
        read: () => false,
      },
    },
    // Top-level visible field
    {
      name: 'visibleTopLevel',
      type: 'text',
    },
    // Group with restricted nested field
    {
      name: 'contactInfo',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'secretPhone',
          type: 'text',
          access: {
            read: () => false,
          },
        },
        {
          name: 'publicPhone',
          type: 'text',
        },
        {
          name: 'virtualContactName',
          type: 'text',
          virtual: 'unrestricted.name',
        },
        {
          name: 'restrictedVirtualContactInfo',
          type: 'text',
          virtual: 'unrestricted.name',
          access: {
            read: () => false,
          },
        },
      ],
    },
    // Row with restricted field
    {
      type: 'row',
      fields: [
        {
          name: 'visibleInRow',
          type: 'text',
        },
        {
          name: 'restrictedInRow',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
    },
    // Collapsible with restricted field
    {
      type: 'collapsible',
      label: 'Additional Info',
      fields: [
        {
          name: 'visibleInCollapsible',
          type: 'text',
        },
        {
          name: 'restrictedInCollapsible',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
    },
    // Array with restricted fields
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'secretDescription',
          type: 'textarea',
          access: {
            read: () => false,
          },
        },
        {
          name: 'publicDescription',
          type: 'textarea',
        },
      ],
    },
    // Tabs with restricted fields
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Public Tab',
          fields: [
            {
              name: 'publicData',
              type: 'text',
            },
            {
              name: 'secretInPublicTab',
              type: 'text',
              access: {
                read: () => false,
              },
            },
          ],
        },
        {
          label: 'Settings',
          name: 'settings',
          fields: [
            {
              name: 'visibleSetting',
              type: 'checkbox',
            },
            {
              name: 'restrictedSetting',
              type: 'checkbox',
              access: {
                read: () => false,
              },
            },
          ],
        },
      ],
    },
    // Deeply nested: Group > Group with restricted field
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'analytics',
          type: 'group',
          fields: [
            {
              name: 'visibleMetric',
              type: 'number',
            },
            {
              name: 'restrictedMetric',
              type: 'number',
              access: {
                read: () => false,
              },
            },
          ],
        },
      ],
    },
    // Group with row inside with restricted field
    {
      name: 'address',
      type: 'group',
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
            },
            {
              name: 'secretPostalCode',
              type: 'text',
              access: {
                read: () => false,
              },
            },
          ],
        },
      ],
    },
    // Collapsible with group inside with restricted field
    {
      type: 'collapsible',
      label: 'Advanced Settings',
      fields: [
        {
          name: 'advanced',
          type: 'group',
          fields: [
            {
              name: 'visibleAdvanced',
              type: 'text',
            },
            {
              name: 'restrictedAdvanced',
              type: 'text',
              access: {
                read: () => false,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'unrestricted',
      type: 'relationship',
      relationTo: unrestrictedSlug,
    },
    {
      name: 'unrestrictedVirtualFieldName',
      type: 'text',
      virtual: 'unrestricted.name',
    },
    {
      name: 'unrestrictedVirtualGroupInfo',
      type: 'group',
      virtual: 'unrestricted.info',
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
    },
    {
      name: 'restrictedVirtualField',
      type: 'text',
      virtual: 'unrestricted.name',
      access: {
        read: () => false,
      },
    },
  ],
}
