import type {
  ClientField,
  ClientFieldSchemaMap,
  Field,
  SanitizedFieldsPermissions,
  VersionField,
} from 'payload'

import { getFieldPaths } from 'payload/shared'
import { describe, expect, it, vi } from 'vitest'

import { buildVersionFields, type BuildVersionFieldsArgs } from './buildVersionFields.js'

vi.mock('@payloadcms/ui/elements/RenderServerComponent', () => ({
  RenderServerComponent: () => null,
}))

describe('buildVersionFields', () => {
  it('should render version diffs when a block with unnamed row and collapsible fields is replaced', () => {
    const linkButtonBlock = {
      fields: [
        {
          fields: [{ name: 'variant', type: 'text' }],
          name: 'appearance',
          type: 'group',
        },
        {
          fields: [{ name: 'label', type: 'text' }],
          type: 'row',
        },
        {
          fields: [{ name: 'eventTag', type: 'text' }],
          label: 'Tracking',
          type: 'collapsible',
        },
      ],
      slug: 'link-button',
    } satisfies { fields: Field[]; slug: string }
    const signInButtonBlock = {
      fields: [
        {
          fields: [{ name: 'variant', type: 'text' }],
          name: 'appearance',
          type: 'group',
        },
        {
          fields: [{ name: 'label', type: 'text' }],
          type: 'row',
        },
        { name: 'isSignup', type: 'checkbox' },
        {
          fields: [{ name: 'eventTag', type: 'text' }],
          label: 'Tracking',
          type: 'collapsible',
        },
      ],
      slug: 'sign-in-button',
    } satisfies { fields: Field[]; slug: string }
    const blocksField = {
      blocks: [linkButtonBlock, signInButtonBlock],
      name: 'ctas',
      type: 'blocks',
    } satisfies Field
    const clientSchemaMap = new Map([['pages.ctas', blocksField]]) as ClientFieldSchemaMap

    addFieldsToClientSchemaMap({
      clientSchemaMap,
      entitySlug: 'pages',
      fields: linkButtonBlock.fields,
      parentSchemaPath: 'ctas.link-button',
    })
    addFieldsToClientSchemaMap({
      clientSchemaMap,
      entitySlug: 'pages',
      fields: signInButtonBlock.fields,
      parentSchemaPath: 'ctas.sign-in-button',
    })

    const { versionFields } = buildVersionFields({
      clientSchemaMap,
      customDiffComponents: {},
      entitySlug: 'pages',
      fields: [blocksField],
      fieldsPermissions: { ctas: true } as SanitizedFieldsPermissions,
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
        ctas: [
          {
            appearance: { variant: 'primary' },
            blockType: 'sign-in-button',
            eventTag: 'sign-in tracking',
            isSignup: true,
            label: 'Sign in',
          },
        ],
      },
      versionToSiblingData: {
        ctas: [
          {
            appearance: { variant: 'secondary' },
            blockType: 'link-button',
            eventTag: 'link tracking',
            label: 'Learn more',
          },
        ],
      },
    } as BuildVersionFieldsArgs)

    const rowFields = versionFields[0]?.field?.rows?.[0] ?? []
    const schemaPaths = getSchemaPaths(rowFields)

    expect(schemaPaths).toEqual(
      expect.arrayContaining([
        'ctas.sign-in-button._index-1.label',
        'ctas.sign-in-button._index-3.eventTag',
        'ctas.link-button._index-1.label',
        'ctas.link-button._index-2.eventTag',
      ]),
    )
  })

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

function addFieldsToClientSchemaMap({
  clientSchemaMap,
  entitySlug,
  fields,
  parentIndexPath = '',
  parentSchemaPath,
}: {
  clientSchemaMap: ClientFieldSchemaMap
  entitySlug: string
  fields: Field[]
  parentIndexPath?: string
  parentSchemaPath: string
}): void {
  fields.forEach((field, index) => {
    const { indexPath, schemaPath } = getFieldPaths({
      field,
      index,
      parentIndexPath,
      parentSchemaPath,
    })

    clientSchemaMap.set(`${entitySlug}.${schemaPath}`, field as ClientField)

    if (field.type === 'collapsible' || field.type === 'row') {
      addFieldsToClientSchemaMap({
        clientSchemaMap,
        entitySlug,
        fields: field.fields,
        parentIndexPath: indexPath,
        parentSchemaPath: schemaPath,
      })
    } else if (field.type === 'group') {
      addFieldsToClientSchemaMap({
        clientSchemaMap,
        entitySlug,
        fields: field.fields,
        parentIndexPath: 'name' in field ? '' : indexPath,
        parentSchemaPath: schemaPath,
      })
    }
  })
}

function getSchemaPaths(versionFields: VersionField[]): string[] {
  return versionFields.flatMap((versionField) => {
    const field = versionField.field

    if (!field) {
      return []
    }

    return [
      field.schemaPath,
      ...getSchemaPaths(field.fields),
      ...(field.rows?.flatMap((row) => getSchemaPaths(row)) ?? []),
      ...(field.tabs?.flatMap((tab) => getSchemaPaths(tab.fields)) ?? []),
    ]
  })
}
