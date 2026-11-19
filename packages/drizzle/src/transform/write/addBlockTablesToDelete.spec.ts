import type { Field, FlattenedBlocksField } from 'payload'

import { flattenAllFields } from 'payload/shared'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../../types.js'

import { addBlockTablesToDelete } from './addBlockTablesToDelete.js'

describe('addBlockTablesToDelete', () => {
  it.each(['blocks', 'group'] as const)(
    'should skip virtual %s fields while retaining stored nested block tables',
    (type) => {
      const virtualBlocks: Field = {
        name: 'computedBlocks',
        type: 'blocks',
        blocks: [{ slug: 'computed', fields: [] }],
        virtual: true,
      }
      const virtualField: Field =
        type === 'blocks'
          ? virtualBlocks
          : {
              name: 'computedGroup',
              type: 'group',
              fields: [{ ...virtualBlocks, virtual: false }],
              virtual: true,
            }
      const [field] = flattenAllFields({
        fields: [
          {
            name: 'layout',
            type: 'blocks',
            blocks: [
              {
                slug: 'container',
                fields: [
                  virtualField,
                  {
                    name: 'storedBlocks',
                    type: 'blocks',
                    blocks: [{ slug: 'stored', fields: [] }],
                  },
                ],
              },
            ],
          },
        ],
      })
      const blocksToDelete = new Set<string>()
      const adapter = {
        tableNameMap: new Map([
          ['posts_blocks_container', 'posts_blocks_container'],
          ['posts_blocks_stored', 'posts_blocks_stored'],
        ]),
      } as DrizzleAdapter

      addBlockTablesToDelete({
        adapter,
        baseTableName: 'posts',
        blocksToDelete,
        field: field as FlattenedBlocksField,
      })

      expect([...blocksToDelete]).toEqual(['posts_blocks_container', 'posts_blocks_stored'])
    },
  )
})
