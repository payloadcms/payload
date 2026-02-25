import type { CollectionConfig } from 'payload'

import { blocksFieldAccessSlug } from '../../shared.js'

export const BlocksFieldAccess: CollectionConfig = {
  slug: blocksFieldAccessSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    // Block field with normal blocks - NO access control (should be fully editable)
    {
      type: 'blocks',
      name: 'editableBlocks',
      blocks: [
        {
          slug: 'testBlock',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'content',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    // Block field with normal blocks - WITH access control (should be read-only)
    {
      type: 'blocks',
      name: 'readOnlyBlocks',
      access: {
        read: () => true,
        create: () => false,
        update: () => false,
      },
      blocks: [
        {
          slug: 'testBlock2',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'content',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    // Block field with block references - NO access control (should be fully editable)
    {
      type: 'blocks',
      name: 'editableBlockRefs',
      blocks: [],
      blockReferences: ['titleblock'],
    },
    // Block field with block references - WITH access control (should be read-only)
    {
      type: 'blocks',
      name: 'readOnlyBlockRefs',
      access: {
        read: () => true,
        create: () => false,
        update: () => false,
      },
      blocks: [],
      blockReferences: ['titleblock'],
    },
    // Test tab with read-only blocks fields
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab Read-Only Test',
          name: 'tabReadOnlyTest',
          fields: [
            // Block field with normal blocks - WITH access control (should be read-only) - IN TAB
            {
              type: 'blocks',
              name: 'tabReadOnlyBlocks',
              access: {
                read: () => true,
                create: () => false,
                update: () => false,
              },
              blocks: [
                {
                  slug: 'testBlock3',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                    },
                    {
                      name: 'content',
                      type: 'textarea',
                    },
                  ],
                },
              ],
            },
            // Block field with block references - WITH access control (should be read-only) - IN TAB
            {
              type: 'blocks',
              name: 'tabReadOnlyBlockRefs',
              access: {
                read: () => true,
                create: () => false,
                update: () => false,
              },
              blocks: [],
              blockReferences: ['titleblock'],
            },
          ],
        },
      ],
    },
  ],
}
