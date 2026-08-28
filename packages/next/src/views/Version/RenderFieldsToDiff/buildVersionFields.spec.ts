import type { ClientFieldSchemaMap, Field, SanitizedFieldsPermissions } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { buildVersionFields, type BuildVersionFieldsArgs } from './buildVersionFields.js'

vi.mock('@payloadcms/ui/elements/RenderServerComponent', () => ({
  RenderServerComponent: () => null,
}))

describe('buildVersionFields', () => {
  it('should use the source block permissions when a block is replaced', () => {
    const sourceBlock = {
      fields: [{ name: 'shared', type: 'text' }],
      slug: 'source',
    } satisfies { fields: Field[]; slug: string }
    const replacementBlock = {
      fields: [{ name: 'shared', type: 'text' }],
      slug: 'replacement',
    } satisfies { fields: Field[]; slug: string }
    const blocksField = {
      blocks: [sourceBlock, replacementBlock],
      name: 'blocks',
      type: 'blocks',
    } satisfies Field
    const clientSchemaMap = new Map([
      ['pages.blocks', blocksField],
      ['pages.blocks.source.shared', sourceBlock.fields[0]],
      ['pages.blocks.replacement.shared', replacementBlock.fields[0]],
    ]) as ClientFieldSchemaMap
    const fieldsPermissions = {
      blocks: {
        blocks: {
          replacement: { fields: {} },
          source: { fields: { shared: true } },
        },
        read: true,
      },
    } as SanitizedFieldsPermissions

    const { versionFields } = buildVersionFields({
      clientSchemaMap,
      customDiffComponents: {},
      entitySlug: 'pages',
      fields: [blocksField],
      fieldsPermissions,
      i18n: { t: (key: string) => key },
      modifiedOnly: true,
      parentIndexPath: '',
      parentIsLocalized: false,
      parentPath: '',
      parentSchemaPath: '',
      req: {
        payload: {
          blocks: {},
          importMap: {},
          logger: { error: vi.fn() },
        },
      },
      selectedLocales: [],
      versionFromSiblingData: {
        blocks: [{ blockType: 'source', shared: 'readable source value' }],
      },
      versionToSiblingData: {
        blocks: [{ blockType: 'replacement' }],
      },
    } as BuildVersionFieldsArgs)

    const rowFields = versionFields[0]?.field?.rows?.[0]

    expect(rowFields).toHaveLength(1)
    expect(rowFields?.[0]?.field?.path).toBe('blocks.0.shared')
    expect(rowFields?.[0]?.field?.schemaPath).toBe('blocks.source.shared')
  })
})
