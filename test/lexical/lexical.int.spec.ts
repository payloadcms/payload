import type {
  SerializedEditorState,
  SerializedParagraphNode,
} from '@payloadcms/richtext-lexical/lexical'
import type { PaginatedDocs, Payload } from 'payload'

import {
  buildEditorState,
  type DefaultNodeTypes,
  type SerializedBlockNode,
  type SerializedLinkNode,
  type SerializedRelationshipNode,
  type SerializedUploadNode,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { sanitizeUrl } from 'payload/shared'
import { fileURLToPath } from 'url'
import { beforeAll, beforeEach, describe, expect, it as vitestIt } from 'vitest'

import type { LexicalField, LexicalMigrateField, RichTextField } from './payload-types.js'

// Sync converters
import { HeadingHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/heading.js'
import { LinkHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/link.js'
import { ListHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/list.js'
import { TableHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/table.js'
import { TextHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/text.js'
import { UploadHTMLConverter } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/sync/converters/upload.js'

// Async converters
import { HeadingHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/heading.js'
import { LinkHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/link.js'
import { ListHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/list.js'
import { TableHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/table.js'
import { TextHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/text.js'
import { UploadHTMLConverterAsync } from '../../packages/richtext-lexical/src/features/converters/lexicalToHtml/async/converters/upload.js'

// Diff converter
import { LinkDiffHTMLConverterAsync } from '../../packages/richtext-lexical/src/field/Diff/converters/link.js'
import { it } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import { devUser } from '../credentials.js'
import { lexicalDocData } from './collections/Lexical/data.js'
import { generateLexicalLocalizedRichText } from './collections/LexicalLocalized/generateLexicalRichText.js'
import { lexicalMigrateDocData } from './collections/LexicalMigrate/data.js'
import { richTextDocData } from './collections/RichText/data.js'
import { generateLexicalRichText } from './collections/RichText/generateLexicalRichText.js'
import { textDoc } from './collections/Text/shared.js'
import { uploadsDoc } from './collections/Upload/shared.js'
import { clearAndSeedEverything } from './seed.js'
import {
  arrayFieldsSlug,
  lexicalFieldsSlug,
  lexicalMigrateFieldsSlug,
  richTextFieldsSlug,
  textFieldsSlug,
  uploadsSlug,
} from './slugs.js'

let payload: Payload
let restClient: NextRESTClient

let createdArrayDocID: number | string = null
let createdJPGDocID: number | string = null
let createdTextDocID: number | string = null
let createdRichTextDocID: number | string = null

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Lexical', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    restClient = new NextRESTClient(payload.config)
    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })

    createdArrayDocID = (
      await payload.find({
        collection: arrayFieldsSlug,
        depth: 0,
        where: {
          title: {
            equals: 'array doc 1',
          },
        },
      })
    ).docs[0].id

    createdJPGDocID = (
      await payload.find({
        collection: uploadsSlug,
        depth: 0,
        where: {
          filename: {
            equals: 'payload.jpg',
          },
        },
      })
    ).docs[0].id

    createdTextDocID = (
      await payload.find({
        collection: textFieldsSlug,
        depth: 0,
        where: {
          text: {
            equals: 'Seeded text document',
          },
        },
      })
    ).docs[0].id

    createdRichTextDocID = (
      await payload.find({
        collection: richTextFieldsSlug,
        depth: 0,
        where: {
          title: {
            equals: 'Rich Text',
          },
        },
      })
    ).docs[0].id
  })

  describe('basic', () => {
    it('should allow querying on lexical content', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: richTextDocData.title,
            },
          },
        })
      ).docs[0] as never

      expect(richTextDoc?.lexicalCustomFields).toStrictEqual(
        JSON.parse(
          JSON.stringify(generateLexicalRichText())
            .replace(
              /"\{\{ARRAY_DOC_ID\}\}"/g,
              payload.db.defaultIDType === 'number'
                ? `${createdArrayDocID}`
                : `"${createdArrayDocID}"`,
            )
            .replace(
              /"\{\{UPLOAD_DOC_ID\}\}"/g,
              payload.db.defaultIDType === 'number' ? `${createdJPGDocID}` : `"${createdJPGDocID}"`,
            )
            .replace(
              /"\{\{TEXT_DOC_ID\}\}"/g,
              payload.db.defaultIDType === 'number'
                ? `${createdTextDocID}`
                : `"${createdTextDocID}"`,
            ),
        ),
      )
    })

    it('should populate respect depth parameter and populate link node relationship', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          depth: 1,
          where: {
            title: {
              equals: richTextDocData.title,
            },
          },
        })
      ).docs[0] as never

      const seededDocument = JSON.parse(
        JSON.stringify(generateLexicalRichText())
          .replace(
            /"\{\{ARRAY_DOC_ID\}\}"/g,
            payload.db.defaultIDType === 'number'
              ? `${createdArrayDocID}`
              : `"${createdArrayDocID}"`,
          )
          .replace(
            /"\{\{UPLOAD_DOC_ID\}\}"/g,
            payload.db.defaultIDType === 'number' ? `${createdJPGDocID}` : `"${createdJPGDocID}"`,
          )
          .replace(
            /"\{\{TEXT_DOC_ID\}\}"/g,
            payload.db.defaultIDType === 'number' ? `${createdTextDocID}` : `"${createdTextDocID}"`,
          ),
      )

      expect(richTextDoc?.lexicalCustomFields).not.toStrictEqual(seededDocument) // The whole seededDocument should not match, as richTextDoc should now contain populated documents not present in the seeded document

      const lexical: SerializedEditorState = richTextDoc?.lexicalCustomFields

      const linkNode: SerializedLinkNode = (lexical.root.children[1] as SerializedParagraphNode)
        .children[3] as SerializedLinkNode
      expect(linkNode.fields.doc.value.text).toStrictEqual(textDoc.text)
    })

    it('should populate relationship node', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          depth: 1,
          where: {
            title: {
              equals: richTextDocData.title,
            },
          },
        })
      ).docs[0] as never

      const relationshipNode: SerializedRelationshipNode =
        richTextDoc.lexicalCustomFields.root.children.find(
          (node) => node.type === 'relationship',
        ) as SerializedRelationshipNode

      expect(relationshipNode.value.text).toStrictEqual(textDoc.text)
    })

    it('should respect GraphQL rich text depth parameter and populate upload node', async () => {
      const query = `query {
        RichTextFields {
          docs {
            lexicalCustomFields(depth: 2)
          }
        }
      }`

      const response: {
        data: { RichTextFields: PaginatedDocs<RichTextField> }
      } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      const { docs } = response.data.RichTextFields

      const uploadNode: SerializedUploadNode = docs[0].lexicalCustomFields.root.children.find(
        (node) => node.type === 'upload',
      ) as SerializedUploadNode
      expect((uploadNode.value.media as any).filename).toStrictEqual('payload.png')
    })
  })

  it('ensure link nodes convert to markdown', async () => {
    const newLexicalDoc = await payload.create({
      collection: lexicalFieldsSlug,
      depth: 0,
      data: {
        title: 'Lexical Markdown Test',
        lexicalWithBlocks: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'link to payload',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'autolink',
                    version: 2,
                    fields: {
                      linkType: 'custom',
                      url: 'https://payloadcms.com',
                    },
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
          },
        },
      },
    })

    expect(newLexicalDoc.lexicalWithBlocks_markdown).toEqual(
      '[link to payload](https://payloadcms.com)',
    )
  })

  describe('upload markdown: Lexical → Markdown (export)', () => {
    it('exports upload node to markdown placeholder when unpopulated', async () => {
      const newLexicalDoc = await payload.create({
        collection: lexicalFieldsSlug,
        depth: 0,
        data: {
          title: 'Lexical Upload Markdown Unpopulated',
          lexicalWithBlocks: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  format: '',
                  type: 'upload',
                  version: 2,
                  relationTo: 'uploads',
                  value: createdJPGDocID,
                  fields: {},
                },
              ],
              direction: 'ltr',
            },
          },
        },
      })

      expect(newLexicalDoc.lexicalWithBlocks_markdown).toEqual(`![uploads:${createdJPGDocID}]()`)
    })

    it('exported markdown contains upload placeholder in seeded doc', async () => {
      const lexicalDoc = await payload.find({
        collection: lexicalFieldsSlug,
        depth: 0,
        where: { title: { equals: lexicalDocData.title } },
      })

      const markdown = lexicalDoc.docs[0]?.lexicalWithBlocks_markdown as string
      expect(markdown).toBeDefined()
      expect(markdown).toContain(`![uploads:${createdJPGDocID}]()`)
    })
  })

  describe('converters and migrations', () => {
    it('htmlConverter: should output correct HTML for top-level lexical field', async () => {
      const lexicalDoc: LexicalMigrateField = (
        await payload.find({
          collection: lexicalMigrateFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalMigrateDocData.title,
            },
          },
        })
      ).docs[0] as never

      const htmlField = lexicalDoc?.lexicalSimple_html
      expect(htmlField).toStrictEqual('<div class="payload-richtext"><p>simple</p></div>')
    })
    it('htmlConverter: should output correct HTML for lexical field nested in group', async () => {
      const lexicalDoc: LexicalMigrateField = (
        await payload.find({
          collection: lexicalMigrateFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalMigrateDocData.title,
            },
          },
        })
      ).docs[0] as never

      const htmlField = lexicalDoc?.groupWithLexicalField?.lexicalInGroupField_html
      expect(htmlField).toStrictEqual('<div class="payload-richtext"><p>group</p></div>')
    })
    it('htmlConverter: should output correct HTML for lexical field nested in array', async () => {
      const lexicalDoc: LexicalMigrateField = (
        await payload.find({
          collection: lexicalMigrateFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalMigrateDocData.title,
            },
          },
        })
      ).docs[0] as never

      const htmlField1 = lexicalDoc?.arrayWithLexicalField?.[0]?.lexicalInArrayField_html
      const htmlField2 = lexicalDoc?.arrayWithLexicalField?.[1]?.lexicalInArrayField_html

      expect(htmlField1).toStrictEqual('<div class="payload-richtext"><p>array 1</p></div>')
      expect(htmlField2).toStrictEqual('<div class="payload-richtext"><p>array 2</p></div>')
    })
  })
  describe('advanced - blocks', () => {
    it('should not populate relationships in blocks if depth is 0', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const relationshipBlockNode: SerializedBlockNode = lexicalField.root
        .children[2] as SerializedBlockNode

      /**
       * Depth 1 population:
       */
      expect(relationshipBlockNode.fields.rel).toStrictEqual(createdJPGDocID)
    })

    it('should populate relationships in blocks with depth=1', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 1,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const relationshipBlockNode: SerializedBlockNode = lexicalField.root
        .children[2] as SerializedBlockNode

      /**
       * Depth 1 population:
       */
      expect(relationshipBlockNode.fields.rel.filename).toStrictEqual('payload.jpg')
    })

    it('should correctly populate polymorphic hasMany relationships in blocks with depth=0', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const relationshipBlockNode: SerializedBlockNode = lexicalField.root
        .children[3] as SerializedBlockNode

      /**
       * Depth 0 population:
       */
      expect(Object.keys(relationshipBlockNode.fields.rel[0])).toHaveLength(2)
      expect(relationshipBlockNode.fields.rel[0].relationTo).toStrictEqual('text-fields')
      expect(relationshipBlockNode.fields.rel[0].value).toStrictEqual(createdTextDocID)

      expect(Object.keys(relationshipBlockNode.fields.rel[1])).toHaveLength(2)
      expect(relationshipBlockNode.fields.rel[1].relationTo).toStrictEqual('uploads')
      expect(relationshipBlockNode.fields.rel[1].value).toStrictEqual(createdJPGDocID)
    })

    it('should correctly populate polymorphic hasMany relationships in blocks with depth=1', async () => {
      // Related issue: https://github.com/payloadcms/payload/issues/4277
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 1,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const relationshipBlockNode: SerializedBlockNode = lexicalField.root
        .children[3] as SerializedBlockNode

      /**
       * Depth 1 population:
       */
      expect(Object.keys(relationshipBlockNode.fields.rel[0])).toHaveLength(2)
      expect(relationshipBlockNode.fields.rel[0].relationTo).toStrictEqual('text-fields')
      expect(relationshipBlockNode.fields.rel[0].value.id).toStrictEqual(createdTextDocID)
      expect(relationshipBlockNode.fields.rel[0].value.text).toStrictEqual(textDoc.text)
      expect(relationshipBlockNode.fields.rel[0].value.localizedText).toStrictEqual(
        textDoc.localizedText,
      )

      expect(Object.keys(relationshipBlockNode.fields.rel[1])).toHaveLength(2)
      expect(relationshipBlockNode.fields.rel[1].relationTo).toStrictEqual('uploads')
      expect(relationshipBlockNode.fields.rel[1].value.id).toStrictEqual(createdJPGDocID)
      expect(relationshipBlockNode.fields.rel[1].value.text).toStrictEqual(uploadsDoc.text)
      expect(relationshipBlockNode.fields.rel[1].value.filename).toStrictEqual('payload.jpg')
    })

    it('should not populate relationship nodes inside of a sub-editor from a blocks node with 0 depth', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 0,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const subEditorBlockNode: SerializedBlockNode = lexicalField.root
        .children[4] as SerializedBlockNode

      const subEditor: SerializedEditorState = subEditorBlockNode.fields.richTextField

      const subEditorRelationshipNode: SerializedRelationshipNode = subEditor.root
        .children[0] as SerializedRelationshipNode

      /**
       * Depth 1 population:
       */
      expect(subEditorRelationshipNode.value).toStrictEqual(createdRichTextDocID)
      // But the value should not be populated and only have the id field:

      expect(typeof subEditorRelationshipNode.value).not.toStrictEqual('object')
    })

    it('should populate relationship nodes inside of a sub-editor from a blocks node with 1 depth', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 1,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const subEditorBlockNode: SerializedBlockNode = lexicalField.root
        .children[4] as SerializedBlockNode

      const subEditor: SerializedEditorState = subEditorBlockNode.fields.richTextField

      const subEditorRelationshipNode: SerializedRelationshipNode = subEditor.root
        .children[0] as SerializedRelationshipNode

      /**
       * Depth 1 population:
       */
      expect(subEditorRelationshipNode.value.id).toStrictEqual(createdRichTextDocID)
      expect(subEditorRelationshipNode.value.title).toStrictEqual(richTextDocData.title)

      // Make sure that the referenced, popular document is NOT populated (that would require depth > 2):

      const populatedDocEditorState: SerializedEditorState = subEditorRelationshipNode.value
        .lexicalCustomFields as SerializedEditorState

      const populatedDocEditorRelationshipNode: SerializedRelationshipNode = populatedDocEditorState
        .root.children[2] as SerializedRelationshipNode

      //console.log('populatedDocEditorRelatonshipNode:', populatedDocEditorRelationshipNode)

      /**
       * Depth 2 population:
       */
      expect(populatedDocEditorRelationshipNode.value).toStrictEqual(createdTextDocID)
      // But the value should not be populated and only have the id field - that's because it would require a depth of 2
      expect(populatedDocEditorRelationshipNode.value).not.toStrictEqual('object')
    })

    it('should populate relationship nodes inside of a sub-editor from a blocks node with depth 2', async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 2,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalWithBlocks

      const subEditorBlockNode: SerializedBlockNode = lexicalField.root
        .children[4] as SerializedBlockNode

      const subEditor: SerializedEditorState = subEditorBlockNode.fields.richTextField

      const subEditorRelationshipNode: SerializedRelationshipNode = subEditor.root
        .children[0] as SerializedRelationshipNode

      /**
       * Depth 1 population:
       */
      expect(subEditorRelationshipNode.value.id).toStrictEqual(createdRichTextDocID)
      expect(subEditorRelationshipNode.value.title).toStrictEqual(richTextDocData.title)

      // Make sure that the referenced, popular document is NOT populated (that would require depth > 2):

      const populatedDocEditorState: SerializedEditorState = subEditorRelationshipNode.value
        .lexicalCustomFields as SerializedEditorState

      const populatedDocEditorRelationshipNode: SerializedRelationshipNode = populatedDocEditorState
        .root.children[2] as SerializedRelationshipNode

      /**
       * Depth 2 population:
       */
      expect(populatedDocEditorRelationshipNode.value.id).toStrictEqual(createdTextDocID)
      // Should now be populated (length 12)
      expect(populatedDocEditorRelationshipNode.value.text).toStrictEqual(textDoc.text)
    })
  })

  describe('Localization', () => {
    it('ensure localized lexical field is different across locales', async () => {
      const lexicalDocEN = await payload.find({
        collection: 'lexical-localized-fields',
        locale: 'en',
        where: {
          title: {
            equals: 'Localized Lexical en',
          },
        },
      })

      expect(lexicalDocEN.docs[0].lexicalBlocksLocalized.root.children[0].children[0].text).toEqual(
        'English text',
      )

      const lexicalDocES = await payload.findByID({
        collection: 'lexical-localized-fields',
        locale: 'es',
        id: lexicalDocEN.docs[0].id,
      })

      expect(lexicalDocES.lexicalBlocksLocalized.root.children[0].children[0].text).toEqual(
        'Spanish text',
      )
    })

    it('ensure localized text field within blocks field within unlocalized lexical field is different across locales', async () => {
      const lexicalDocEN = await payload.find({
        collection: 'lexical-localized-fields',
        locale: 'en',
        where: {
          title: {
            equals: 'Localized Lexical en',
          },
        },
      })

      expect(
        lexicalDocEN.docs[0].lexicalBlocksSubLocalized.root.children[0].children[0].text,
      ).toEqual('Shared text')

      expect(
        (lexicalDocEN.docs[0].lexicalBlocksSubLocalized.root.children[1].fields as any)
          .textLocalized,
      ).toEqual('English text in block')

      const lexicalDocES = await payload.findByID({
        collection: 'lexical-localized-fields',
        locale: 'es',
        id: lexicalDocEN.docs[0].id,
      })

      expect(lexicalDocES.lexicalBlocksSubLocalized.root.children[0].children[0].text).toEqual(
        'Shared text',
      )

      expect(
        (lexicalDocES.lexicalBlocksSubLocalized.root.children[1].fields as any).textLocalized,
      ).toEqual('Spanish text in block')
    })
  })

  describe('Hooks', () => {
    it('ensure hook within number field within lexical block runs', async () => {
      const lexicalDocEN = await payload.create({
        collection: 'lexical-localized-fields',
        locale: 'en',
        data: {
          title: 'Localized Lexical hooks',
          lexicalBlocksLocalized: buildEditorState<DefaultNodeTypes>({ text: 'some text' }),
          lexicalBlocksSubLocalized: generateLexicalLocalizedRichText(
            'Shared text',
            'English text in block',
          ) as any,
        },
      })

      expect(
        (lexicalDocEN.lexicalBlocksSubLocalized.root.children[1].fields as any).counter,
      ).toEqual(20) // Initial: 1. BeforeChange: +1 (2). AfterRead: *10 (20)

      // update document with same data
      const lexicalDocENUpdated = await payload.update({
        collection: 'lexical-localized-fields',
        locale: 'en',
        id: lexicalDocEN.id,
        data: lexicalDocEN,
      })

      expect(
        (lexicalDocENUpdated.lexicalBlocksSubLocalized.root.children[1].fields as any).counter,
      ).toEqual(210) // Initial: 20. BeforeChange: +1 (21). AfterRead: *10 (210)
    })
  })

  describe('richText', () => {
    it('should allow querying on rich text content', async () => {
      const emptyRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'doesnt exist',
          },
        },
      })

      expect(emptyRichTextQuery.docs).toHaveLength(0)

      const workingRichTextQuery = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'hello',
          },
        },
      })

      expect(workingRichTextQuery.docs).toHaveLength(1)
    })

    it('should show center alignment', async () => {
      const query = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.text': {
            like: 'hello',
          },
        },
      })

      expect(query.docs[0]?.richText[0]?.textAlign).toEqual('center')
    })

    it('should populate link relationship', async () => {
      const query = await payload.find({
        collection: 'rich-text-fields',
        where: {
          'richText.children.linkType': {
            equals: 'internal',
          },
        },
      })

      const nodes = query.docs[0]?.richText
      expect(nodes).toBeDefined()
      const child = nodes?.flatMap((n) => n.children).find((c) => c?.doc)
      expect(child).toMatchObject({
        type: 'link',
        linkType: 'internal',
      })
      expect(child.doc.relationTo).toEqual('array-fields')

      if (payload.db.defaultIDType === 'number') {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(typeof child.doc.value.id).toBe('number')
      } else {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(typeof child.doc.value.id).toBe('string')
      }

      expect(child.doc.value.items).toHaveLength(6)
    })

    it('should disallow unsafe query paths', async () => {
      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children from': { equals: 5 },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children."unsafe"': { equals: 5 },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.(unsafe"': { equals: 5 },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.unsafe="': { equals: 5 },
          },
        }),
      ).rejects.toBeTruthy()
    })

    it('should disallow unsafe query values', { db: 'drizzle' }, async () => {
      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.value': { equals: 'select(' },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.value': { equals: '"unsafe' },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.value': { equals: `'unsafe` },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.value': { equals: `unsafe\\` },
          },
        }),
      ).rejects.toBeTruthy()

      await expect(
        payload.find({
          collection: 'rich-text-fields',
          where: {
            'richText.children.value': { equals: `unsafe=` },
          },
        }),
      ).rejects.toBeTruthy()
    })
  })

  describe('Autosave', () => {
    it('should populate previousValue in afterChange hooks for fields inside lexical', async () => {
      const { autosaveHookLog, clearAutosaveHookLog } = await import(
        './collections/LexicalAutosave/index.js'
      )

      clearAutosaveHookLog()

      const doc = await payload.create({
        collection: 'lexical-autosave',
        data: {
          title: 'Autosave test document',
          cta: [
            {
              richText: {
                root: {
                  children: [
                    {
                      type: 'block',
                      version: 2,
                      format: '',
                      fields: {
                        id: 'block-id-1',
                        blockName: '',
                        blockTitle: 'Initial block title',
                        blockType: 'textBlock',
                      },
                    },
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              },
            },
          ],
        },
      })

      // Verify create operation has undefined previousValue (expected)
      expect(autosaveHookLog.relationshipField?.operation).toBe('create')
      expect(autosaveHookLog.relationshipField?.previousValue).toBeUndefined()
      expect(autosaveHookLog.relationshipField?.value).toBe('Initial block title')

      clearAutosaveHookLog()

      // Simulate autosave by updating the document
      await payload.update({
        collection: 'lexical-autosave',
        id: doc.id,
        data: {
          title: 'Updated via autosave',
          cta: [
            {
              richText: {
                root: {
                  children: [
                    {
                      type: 'block',
                      version: 2,
                      format: '',
                      fields: {
                        id: 'block-id-1',
                        blockName: '',
                        blockTitle: 'Updated block title',
                        blockType: 'textBlock',
                      },
                    },
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              },
            },
          ],
        },
      })

      expect(autosaveHookLog.relationshipField?.operation).toBe('update')
      expect(autosaveHookLog.relationshipField?.previousValue).toBe('Initial block title')
      expect(autosaveHookLog.relationshipField?.value).toBe('Updated block title')
    })
  })

  describe('sanitizeUrl', () => {
    vitestIt.each([
      ['http://example.com', 'http://example.com'],
      ['https://example.com/page', 'https://example.com/page'],
      ['mailto:user@example.com', 'mailto:user@example.com'],
      ['tel:+1234567890', 'tel:+1234567890'],
      ['#section', '#section'],
      ['/path/to/page', '/path/to/page'],
      ['./relative/path', './relative/path'],
      ['../parent/path', '../parent/path'],
      ['', ''],
      ['example.com', 'example.com'],
    ])('allows safe URL: %s', (input, expected) => {
      expect(sanitizeUrl(input)).toBe(expected)
    })

    vitestIt.each([
      ['javascript:alert(1)', '#'],
      ['JavaScript:alert(document.cookie)', '#'],
      ['JAVASCRIPT:void(0)', '#'],
      ['data:text/html,<script>alert(1)</script>', '#'],
      ['vbscript:MsgBox("test")', '#'],
      ['blob:http://example.com/uuid', '#'],
    ])('blocks disallowed protocol: %s', (input, expected) => {
      expect(sanitizeUrl(input)).toBe(expected)
    })

    vitestIt('trims whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
    })
  })

  const noopNodesToHTML = ({ nodes }: { nodes: any[] }) => nodes.map(() => '')
  const noopNodesToHTMLAsync = ({ nodes }: { nodes: any[] }) => Promise.resolve(nodes.map(() => ''))

  const converterBaseArgs = {
    parent: {} as any,
    providedCSSString: '',
    providedStyleTag: '',
    submissionData: undefined,
    textContent: '',
  }

  const converterVariants = [
    {
      label: 'Sync',
      heading: HeadingHTMLConverter,
      link: LinkHTMLConverter({}),
      list: ListHTMLConverter,
      table: TableHTMLConverter,
      text: TextHTMLConverter,
      upload: UploadHTMLConverter,
      noop: noopNodesToHTML,
    },
    {
      label: 'Async',
      heading: HeadingHTMLConverterAsync,
      link: LinkHTMLConverterAsync({}),
      list: ListHTMLConverterAsync,
      table: TableHTMLConverterAsync,
      text: TextHTMLConverterAsync,
      upload: UploadHTMLConverterAsync,
      noop: noopNodesToHTMLAsync,
    },
  ] as const

  for (const variant of converterVariants) {
    describe(`HTML Converters (${variant.label})`, () => {
      // ── Text ──
      describe('TextHTMLConverter', () => {
        vitestIt('escapes script tags in text content', async () => {
          const result = await variant.text.text!({
            ...converterBaseArgs,
            node: { format: 0, text: '<script>alert("xss")</script>' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
          expect(result).toContain('&lt;script&gt;')
        })

        vitestIt('escapes HTML entities in bold text', async () => {
          const result = await variant.text.text!({
            ...converterBaseArgs,
            node: { format: 1, text: '<img src=x onerror=alert(1)>' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain('<strong>')
          expect(result).not.toContain('<img')
          expect(result).toContain('&lt;img')
        })

        vitestIt('preserves normal text with formatting', async () => {
          const result = await variant.text.text!({
            ...converterBaseArgs,
            node: { format: 1, text: 'Hello World' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toBe('<strong>Hello World</strong>')
        })

        vitestIt('properly encodes ampersands', async () => {
          const result = await variant.text.text!({
            ...converterBaseArgs,
            node: { format: 0, text: 'Tom & Jerry' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toBe('Tom &amp; Jerry')
        })
      })

      // ── Link ──
      describe('LinkHTMLConverter', () => {
        vitestIt('blocks javascript: protocol in autolink', async () => {
          const result = await variant.link.autolink!({
            ...converterBaseArgs,
            node: {
              children: [],
              fields: { newTab: false, url: 'javascript:alert(document.cookie)' },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('javascript:')
          expect(result).toContain('href="#"')
        })

        vitestIt('blocks data: protocol in link', async () => {
          const result = await variant.link.link!({
            ...converterBaseArgs,
            node: {
              children: [],
              fields: {
                linkType: 'custom',
                newTab: false,
                url: 'data:text/html,<script>alert(1)</script>',
              },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('data:')
          expect(result).toContain('href="#"')
        })

        vitestIt('escapes HTML entities in href attribute', async () => {
          const result = await variant.link.autolink!({
            ...converterBaseArgs,
            node: {
              children: [],
              fields: {
                newTab: false,
                url: 'https://example.com/path?a=1&b=2"onmouseover="alert(1)',
              },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('"onmouseover')
          expect(result).toContain('&amp;')
        })

        vitestIt('allows safe https URLs', async () => {
          const result = await variant.link.autolink!({
            ...converterBaseArgs,
            node: {
              children: [],
              fields: { newTab: false, url: 'https://example.com/safe-page' },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain('href="https://example.com/safe-page"')
        })

        vitestIt('preserves query params with proper encoding', async () => {
          const result = await variant.link.autolink!({
            ...converterBaseArgs,
            node: {
              children: [],
              fields: { newTab: false, url: 'https://example.com/search?q=hello&lang=en' },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain('href="https://example.com/search?q=hello&amp;lang=en"')
        })
      })

      // ── Upload ──
      describe('UploadHTMLConverter', () => {
        const baseUploadNode = {
          fields: {},
          relationTo: 'uploads',
          value: {
            filename: 'test.pdf',
            height: 100,
            id: '1',
            mimeType: 'application/pdf',
            sizes: {},
            url: '/uploads/test.pdf',
            width: 100,
          },
        }

        vitestIt('escapes HTML in non-image filename', async () => {
          const result = await variant.upload.upload!({
            ...converterBaseArgs,
            node: {
              ...baseUploadNode,
              value: {
                ...baseUploadNode.value,
                filename: '<img src=x onerror=alert(1)>',
              },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<img')
          expect(result).toContain('&lt;img')
          expect(result).toContain('</a>')
        })

        vitestIt('escapes HTML in alt attribute', async () => {
          const result = await variant.upload.upload!({
            ...converterBaseArgs,
            node: {
              ...baseUploadNode,
              fields: { alt: '"><script>alert(1)</script>' },
              value: { ...baseUploadNode.value, mimeType: 'image/png' },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
          expect(result).toContain('&quot;')
        })

        vitestIt('escapes HTML in image URL', async () => {
          const result = await variant.upload.upload!({
            ...converterBaseArgs,
            node: {
              ...baseUploadNode,
              value: {
                ...baseUploadNode.value,
                mimeType: 'image/png',
                url: '"><script>alert(1)</script>',
              },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
        })

        vitestIt('renders normal image with correct attributes', async () => {
          const result = await variant.upload.upload!({
            ...converterBaseArgs,
            node: {
              fields: { alt: 'A nice photo' },
              relationTo: 'uploads',
              value: {
                filename: 'photo.jpg',
                height: 600,
                id: '1',
                mimeType: 'image/jpeg',
                sizes: {},
                url: '/uploads/photo.jpg',
                width: 800,
              },
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain('alt="A nice photo"')
          expect(result).toContain('src="/uploads/photo.jpg"')
          expect(result).toContain('width="800"')
          expect(result).toContain('height="600"')
        })
      })

      // ── Heading ──
      describe('HeadingHTMLConverter', () => {
        vitestIt.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])('allows valid tag: %s', async (tag) => {
          const result = await variant.heading.heading!({
            ...converterBaseArgs,
            node: { children: [], tag } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain(`<${tag}>`)
          expect(result).toContain(`</${tag}>`)
        })

        vitestIt('rejects arbitrary tag names and defaults to h1', async () => {
          const result = await variant.heading.heading!({
            ...converterBaseArgs,
            node: { children: [], tag: 'script' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
          expect(result).toContain('<h1>')
        })
      })

      // ── List ──
      describe('ListHTMLConverter', () => {
        vitestIt.each(['ol', 'ul'])('allows valid list tag: %s', async (tag) => {
          const result = await variant.list.list!({
            ...converterBaseArgs,
            node: { children: [], listType: 'bullet', tag } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain(`<${tag}`)
          expect(result).toContain(`</${tag}>`)
        })

        vitestIt('rejects arbitrary tag names and defaults to ul', async () => {
          const result = await variant.list.list!({
            ...converterBaseArgs,
            node: { children: [], listType: 'bullet', tag: 'img' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<img')
          expect(result).toContain('<ul')
        })

        vitestIt('validates listType against allowlist', async () => {
          const result = await variant.list.list!({
            ...converterBaseArgs,
            node: { children: [], listType: 'evil"><script>', tag: 'ul' } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
          expect(result).toContain('list-bullet')
        })
      })

      // ── Table ──
      describe('TableHTMLConverter', () => {
        vitestIt.each([
          ['hex', '#ff0000'],
          ['named', 'steelblue'],
          ['rgb()', 'rgb(255, 0, 0)'],
          ['8-char hex', '#ff000080'],
        ])('allows valid %s color for backgroundColor', async (_label, color) => {
          const result = await variant.table.tablecell!({
            ...converterBaseArgs,
            node: {
              backgroundColor: color,
              children: [],
              colSpan: 1,
              headerState: 0,
              rowSpan: 1,
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).toContain(`background-color: ${color};`)
        })

        vitestIt('rejects invalid backgroundColor values', async () => {
          const result = await variant.table.tablecell!({
            ...converterBaseArgs,
            node: {
              backgroundColor: 'red; } </style><script>alert(1)</script>',
              children: [],
              colSpan: 1,
              headerState: 0,
              rowSpan: 1,
            } as any,
            nodesToHTML: variant.noop as any,
          })
          expect(result).not.toContain('<script>')
          expect(result).not.toContain('background-color:')
        })

        vitestIt('renders th for header cells with correct attributes', async () => {
          const result = await variant.table.tablecell!({
            ...converterBaseArgs,
            node: {
              backgroundColor: '#336699',
              children: [],
              colSpan: 2,
              headerState: 1,
              rowSpan: 1,
            } as any,
            nodesToHTML: ({ nodes: _nodes }: any) => ['Cell content'],
          })
          expect(result).toContain('<th')
          expect(result).toContain('background-color: #336699;')
          expect(result).toContain('colspan="2"')
          expect(result).toContain('Cell content')
        })
      })
    })
  }

  describe('UploadHTMLConverter — picture/source path', () => {
    vitestIt('escapes HTML in source srcset and type attributes', () => {
      const result = UploadHTMLConverter.upload!({
        ...converterBaseArgs,
        node: {
          fields: {},
          relationTo: 'uploads',
          value: {
            filename: 'photo.jpg',
            height: 600,
            id: '1',
            mimeType: 'image/jpeg',
            sizes: {
              thumbnail: {
                filename: 'photo-thumb.jpg',
                filesize: 1000,
                height: 100,
                mimeType: '"><script>alert(1)</script>',
                url: '"><img src=x onerror=alert(1)>',
                width: 100,
              },
            },
            url: '/uploads/photo.jpg',
            width: 800,
          },
        } as any,
        nodesToHTML: noopNodesToHTML as any,
      })
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<img src=x')
      expect(result).toContain('&quot;')
      expect(result).toContain('<picture')
      expect(result).toContain('<source')
    })
  })

  describe('Diff View Link Converter', () => {
    const diffLinkConverter = LinkDiffHTMLConverterAsync({})

    vitestIt('blocks disallowed protocols in autolink', async () => {
      const result = await diffLinkConverter.autolink!({
        ...converterBaseArgs,
        node: {
          children: [],
          fields: { newTab: false, url: 'javascript:alert(1)' },
        } as any,
        nodesToHTML: noopNodesToHTMLAsync as any,
      })
      expect(result).not.toContain('javascript:')
      expect(result).toContain('href="#"')
    })

    vitestIt('blocks disallowed protocols in link', async () => {
      const result = await diffLinkConverter.link!({
        ...converterBaseArgs,
        node: {
          children: [],
          fields: {
            linkType: 'custom',
            newTab: false,
            url: 'data:text/html,<script>alert(1)</script>',
          },
        } as any,
        nodesToHTML: noopNodesToHTMLAsync as any,
      })
      expect(result).not.toContain('data:')
      expect(result).toContain('href="#"')
    })

    vitestIt('properly encodes special characters in href', async () => {
      const result = await diffLinkConverter.autolink!({
        ...converterBaseArgs,
        node: {
          children: [],
          fields: { newTab: false, url: 'https://x.com/"onmouseover="alert(1)' },
        } as any,
        nodesToHTML: noopNodesToHTMLAsync as any,
      })
      expect(result).not.toContain('"onmouseover')
      expect(result).toContain('&quot;')
    })

    vitestIt('allows safe URLs and includes fields hash', async () => {
      const result = await diffLinkConverter.autolink!({
        ...converterBaseArgs,
        node: {
          children: [],
          fields: { newTab: false, url: 'https://example.com/page' },
        } as any,
        nodesToHTML: noopNodesToHTMLAsync as any,
      })
      expect(result).toContain('href="https://example.com/page"')
      expect(result).toContain('data-fields-hash=')
    })
  })
})
