import type { Config } from 'payload'

import { isObjectType, type GraphQLObjectType } from 'graphql'
import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { configToSchema } from '../index.js'

describe('configToSchema - blocks', () => {
  it('builds distinct GraphQL types for inline blocks that share a slug across collections', async () => {
    // Two collections each define an inline block with the SAME slug ('text') but a
    // different interfaceName and different fields. The GraphQL schema builder must
    // register both object types, not reuse the first one for the second collection.
    // @ts-expect-error - intentionally minimal config for a unit test of the schema builder
    const config: Config = {
      db: { defaultIDType: 'text' },
      collections: [
        {
          slug: 'a',
          fields: [
            {
              name: 'items',
              type: 'blocks',
              blocks: [
                {
                  slug: 'text',
                  fields: [{ name: 'showOnA', type: 'text' }],
                  interfaceName: 'ABlockText',
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'b',
          fields: [
            {
              name: 'items',
              type: 'blocks',
              blocks: [
                {
                  slug: 'text',
                  fields: [{ name: 'showOnB', type: 'text' }],
                  interfaceName: 'BBlockText',
                },
              ],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const { schema } = configToSchema(sanitizedConfig)

    const aType = schema.getType('ABlockText')
    const bType = schema.getType('BBlockText')

    expect(isObjectType(aType)).toBe(true)
    expect((aType as GraphQLObjectType).getFields()).toHaveProperty('showOnA')

    // Before the fix, collection B's 'text' block reused collection A's cached type
    // (keyed by slug), so BBlockText was never registered and showOnB was unqueryable.
    expect(isObjectType(bType)).toBe(true)
    expect((bType as GraphQLObjectType).getFields()).toHaveProperty('showOnB')
  })
})
