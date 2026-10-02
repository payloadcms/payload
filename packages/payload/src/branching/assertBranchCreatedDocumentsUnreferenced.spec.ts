import type { FlattenedField } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import {
  getPossibleRelationshipCollectionSlugs,
  hasBranchCreatedDocumentReference,
  hasConfiguredRelationshipValue,
} from './assertBranchCreatedDocumentsUnreferenced.js'

const req = {} as PayloadRequest

describe('getPossibleRelationshipCollectionSlugs', () => {
  it('should collect relationship targets from nested and referenced block fields', () => {
    const collectionSlugs = getPossibleRelationshipCollectionSlugs({
      fields: [
        {
          blocks: ['category-block'],
          flattenedFields: [],
          name: 'layout',
          type: 'blocks',
        } as unknown as FlattenedField,
        {
          flattenedFields: [
            {
              name: 'owner',
              relationTo: ['users', 'teams'],
              type: 'relationship',
            },
          ],
          name: 'metadata',
          type: 'group',
        } as unknown as FlattenedField,
      ],
      payloadBlocks: {
        'category-block': {
          flattenedFields: [
            {
              name: 'category',
              relationTo: 'categories',
              type: 'relationship',
            },
          ],
          slug: 'category-block',
        },
      } as PayloadRequest['payload']['blocks'],
    })

    expect(collectionSlugs).toEqual(new Set(['categories', 'users', 'teams']))
  })

  it('should keep dependency lookup unbounded for rich text fields', () => {
    expect(
      getPossibleRelationshipCollectionSlugs({
        fields: [{ name: 'content', type: 'richText' } as FlattenedField],
        payloadBlocks: {},
      }),
    ).toBeUndefined()
  })
})

describe('hasConfiguredRelationshipValue', () => {
  const fields = [
    {
      name: 'category',
      relationTo: 'categories',
      type: 'relationship',
    },
    {
      blocks: ['category-block'],
      flattenedFields: [],
      name: 'layout',
      type: 'blocks',
    },
  ] as unknown as FlattenedField[]
  const payloadBlocks = {
    'category-block': {
      flattenedFields: [
        {
          name: 'category',
          relationTo: 'categories',
          type: 'relationship',
        },
      ],
      slug: 'category-block',
    },
  } as PayloadRequest['payload']['blocks']

  it('should ignore configured relationship fields without values', () => {
    expect(
      hasConfiguredRelationshipValue({
        data: { layout: [{ blockType: 'category-block' }] },
        dataShape: 'withLocales',
        fields,
        payloadBlocks,
      }),
    ).toBe(false)
  })

  it('should detect relationship values inside referenced blocks', () => {
    expect(
      hasConfiguredRelationshipValue({
        data: {
          layout: [{ blockType: 'category-block', category: 'branch-category' }],
        },
        dataShape: 'withLocales',
        fields,
        payloadBlocks,
      }),
    ).toBe(true)
  })

  it('should keep dependency lookup enabled for an unknown stored block type', () => {
    expect(
      hasConfiguredRelationshipValue({
        data: {
          layout: [{ blockType: 'removed-block', category: 'branch-category' }],
        },
        dataShape: 'withLocales',
        fields,
        payloadBlocks,
      }),
    ).toBe(true)
  })
})

describe('hasBranchCreatedDocumentReference', () => {
  it('should detect a flattened localized relationship to branch-created content', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: { target: 'branch-target' },
        dataShape: 'flattened',
        fields: [
          {
            name: 'target',
            localized: true,
            relationTo: 'targets',
            type: 'relationship',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 'branch-target' },
      }),
    ).toBe(true)
  })

  it('should detect a flattened localized polymorphic relationship to branch-created content', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: { target: { relationTo: 'targets', value: 'branch-target' } },
        dataShape: 'flattened',
        fields: [
          {
            name: 'target',
            localized: true,
            relationTo: ['targets', 'other-targets'],
            type: 'relationship',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 'branch-target' },
      }),
    ).toBe(true)
  })

  it('should detect a localized relationship to branch-created content', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: { target: { en: 'branch-target', id: 'another-target' } },
        dataShape: 'withLocales',
        fields: [
          {
            name: 'target',
            localized: true,
            relationTo: 'targets',
            type: 'relationship',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 'branch-target' },
      }),
    ).toBe(true)
  })

  it('should detect a localized polymorphic relationship to branch-created content', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          target: {
            en: { relationTo: 'targets', value: 'branch-target' },
          },
        },
        dataShape: 'withLocales',
        fields: [
          {
            name: 'target',
            localized: true,
            relationTo: ['targets', 'other-targets'],
            type: 'relationship',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 'branch-target' },
      }),
    ).toBe(true)
  })

  it('should ignore a matching relationship ID owned by a different block type', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: [{ blockType: 'other-link', target: 42 }],
        },
        dataShape: 'flattened',
        fields: [
          {
            blocks: [
              {
                flattenedFields: [
                  {
                    name: 'target',
                    relationTo: 'targets',
                    type: 'relationship',
                  },
                ],
                slug: 'target-link',
              },
              {
                flattenedFields: [
                  {
                    name: 'target',
                    relationTo: 'other-targets',
                    type: 'relationship',
                  },
                ],
                slug: 'other-link',
              },
            ],
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })

  it('should ignore serialized reference-shaped data owned by a different block type', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: [
            {
              blockType: 'structured-data',
              content: { relationTo: 'targets', value: 42 },
            },
          ],
        },
        dataShape: 'flattened',
        fields: [
          {
            blocks: [
              {
                flattenedFields: [{ name: 'content', type: 'richText' }],
                slug: 'rich-text',
              },
              {
                flattenedFields: [{ name: 'content', type: 'json' }],
                slug: 'structured-data',
              },
            ],
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })

  it('should retain nested localized block context for populated relationships', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: {
            en: [
              {
                blockType: 'wrapper',
                nested: [{ blockType: 'other-link', target: { id: 42 } }],
              },
            ],
          },
        },
        dataShape: 'withLocales',
        fields: [
          {
            blocks: [
              {
                flattenedFields: [
                  {
                    blocks: [
                      {
                        flattenedFields: [
                          {
                            name: 'target',
                            relationTo: 'targets',
                            type: 'relationship',
                          },
                        ],
                        slug: 'target-link',
                      },
                      {
                        flattenedFields: [
                          {
                            name: 'target',
                            relationTo: 'other-targets',
                            type: 'relationship',
                          },
                        ],
                        slug: 'other-link',
                      },
                    ],
                    name: 'nested',
                    type: 'blocks',
                  },
                ],
                slug: 'wrapper',
              },
            ],
            localized: true,
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })

  it('should detect a scalar relationship in a localized block', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: {
            en: [{ blockType: 'target-link', target: 42 }],
          },
        },
        dataShape: 'withLocales',
        fields: [
          {
            blocks: [
              {
                flattenedFields: [
                  {
                    name: 'target',
                    relationTo: 'targets',
                    type: 'relationship',
                  },
                ],
                slug: 'target-link',
              },
            ],
            localized: true,
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should inspect finite data from a self-referencing reusable block', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: [
            {
              blockType: 'tree',
              children: [
                {
                  blockType: 'tree',
                  target: 42,
                },
              ],
            },
          ],
        },
        dataShape: 'flattened',
        fields: [
          {
            blocks: ['tree'],
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {
          tree: {
            fields: [],
            flattenedFields: [
              {
                name: 'target',
                relationTo: 'targets',
                type: 'relationship',
              },
              {
                blocks: ['tree'],
                name: 'children',
                type: 'blocks',
              },
            ],
            slug: 'tree',
          },
        } as never,
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should inspect finite data from mutually recursive reusable blocks', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          layout: [
            {
              blockType: 'branch',
              children: [
                {
                  blockType: 'leaf',
                  target: 42,
                },
              ],
            },
          ],
        },
        dataShape: 'flattened',
        fields: [
          {
            blocks: ['branch'],
            name: 'layout',
            type: 'blocks',
          } as FlattenedField,
        ],
        payloadBlocks: {
          branch: {
            fields: [],
            flattenedFields: [
              {
                blocks: ['leaf'],
                name: 'children',
                type: 'blocks',
              },
            ],
            slug: 'branch',
          },
          leaf: {
            fields: [],
            flattenedFields: [
              {
                blocks: ['branch'],
                name: 'children',
                type: 'blocks',
              },
              {
                name: 'target',
                relationTo: 'targets',
                type: 'relationship',
              },
            ],
            slug: 'leaf',
          },
        } as never,
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should ignore serialized references in virtual rich text', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: { relationTo: 'targets', value: 42 },
        },
        dataShape: 'flattened',
        fields: [
          {
            name: 'content',
            type: 'richText',
            virtual: true,
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })

  it('should ignore relationships and rich text below virtual containers', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          computedGroup: {
            content: { relationTo: 'targets', value: 42 },
            target: 42,
          },
          computedRows: [{ target: 42 }],
          computedSections: [
            {
              blockType: 'computed-section',
              target: 42,
            },
          ],
        },
        dataShape: 'flattened',
        fields: [
          {
            flattenedFields: [
              { name: 'target', relationTo: 'targets', type: 'relationship' },
              { name: 'content', type: 'richText' },
            ],
            name: 'computedGroup',
            type: 'group',
            virtual: true,
          } as FlattenedField,
          {
            flattenedFields: [{ name: 'target', relationTo: 'targets', type: 'relationship' }],
            name: 'computedRows',
            type: 'array',
            virtual: true,
          } as FlattenedField,
          {
            blocks: [
              {
                flattenedFields: [{ name: 'target', relationTo: 'targets', type: 'relationship' }],
                slug: 'computed-section',
              },
            ],
            name: 'computedSections',
            type: 'blocks',
            virtual: true,
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })

  it('should detect a monomorphic relationship in a rich text block node', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: {
            root: {
              children: [
                {
                  fields: { blockType: 'relationship-block', target: 42 },
                  type: 'block',
                },
              ],
            },
          },
        },
        dataShape: 'flattened',
        fields: [
          {
            editor: {
              editorConfig: {
                features: {
                  getSubFields: new Map([
                    [
                      'block',
                      () => [{ name: 'target', relationTo: 'targets', type: 'relationship' }],
                    ],
                  ]),
                  getSubFieldsData: new Map([
                    [
                      'block',
                      ({ node }: { node: Record<string, unknown> }) =>
                        node.fields as Record<string, unknown>,
                    ],
                  ]),
                },
              },
            },
            name: 'content',
            type: 'richText',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should detect a monomorphic upload in a rich text inline-block node', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: {
            root: {
              children: [
                {
                  fields: { blockType: 'upload-inline-block', media: 42 },
                  type: 'inline-block',
                },
              ],
            },
          },
        },
        dataShape: 'flattened',
        fields: [
          {
            editor: {
              editorConfig: {
                features: {
                  getSubFields: new Map([
                    [
                      'inline-block',
                      () => [{ name: 'media', relationTo: 'media', type: 'upload' }],
                    ],
                  ]),
                  getSubFieldsData: new Map([
                    [
                      'inline-block',
                      ({ node }: { node: Record<string, unknown> }) =>
                        node.fields as Record<string, unknown>,
                    ],
                  ]),
                },
              },
            },
            name: 'content',
            type: 'richText',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'media', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should detect a relationship in reusable block fields nested in rich text', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: {
            root: {
              children: [
                {
                  fields: {
                    nested: [{ blockType: 'relationship-block', target: 42 }],
                  },
                  type: 'block',
                },
              ],
            },
          },
        },
        dataShape: 'flattened',
        fields: [
          {
            editor: {
              editorConfig: {
                features: {
                  getSubFields: new Map([
                    [
                      'block',
                      () => [{ blocks: ['relationship-block'], name: 'nested', type: 'blocks' }],
                    ],
                  ]),
                  getSubFieldsData: new Map([
                    [
                      'block',
                      ({ node }: { node: Record<string, unknown> }) =>
                        node.fields as Record<string, unknown>,
                    ],
                  ]),
                },
              },
            },
            name: 'content',
            type: 'richText',
          } as FlattenedField,
        ],
        payloadBlocks: {
          'relationship-block': {
            fields: [],
            flattenedFields: [{ name: 'target', relationTo: 'targets', type: 'relationship' }],
            slug: 'relationship-block',
          },
        } as never,
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(true)
  })

  it('should not treat a missing serialized relationship value as a custom ID', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: { relationTo: 'targets' },
        },
        dataShape: 'flattened',
        fields: [{ name: 'content', type: 'richText' } as FlattenedField],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 'undefined' },
      }),
    ).toBe(false)
  })

  it('should ignore relationship-shaped JSON in a rich text block node', () => {
    expect(
      hasBranchCreatedDocumentReference({
        data: {
          content: {
            root: {
              children: [
                {
                  fields: { metadata: { relationTo: 'targets', value: 42 } },
                  type: 'block',
                },
              ],
            },
          },
        },
        dataShape: 'flattened',
        fields: [
          {
            editor: {
              editorConfig: {
                features: {
                  getSubFields: new Map([['block', () => [{ name: 'metadata', type: 'json' }]]]),
                  getSubFieldsData: new Map([
                    [
                      'block',
                      ({ node }: { node: Record<string, unknown> }) =>
                        node.fields as Record<string, unknown>,
                    ],
                  ]),
                },
              },
            },
            name: 'content',
            type: 'richText',
          } as FlattenedField,
        ],
        payloadBlocks: {},
        req,
        target: { collectionSlug: 'targets', docID: 42 },
      }),
    ).toBe(false)
  })
})
