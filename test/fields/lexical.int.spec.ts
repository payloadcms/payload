import type {
  SerializedBlockNode,
  SerializedLinkNode,
  SerializedRelationshipNode,
  SerializedUploadNode,
} from '@payloadcms/richtext-lexical'
import type {
  SerializedEditorState,
  SerializedParagraphNode,
} from '@payloadcms/richtext-lexical/lexical'
import type { PaginatedDocs, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { LexicalField, LexicalMigrateField, RichTextField } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { NextRESTClient } from '../helpers/NextRESTClient.js'
import { lexicalDocData } from './collections/Lexical/data.js'
import { generateLexicalLocalizedRichText } from './collections/LexicalLocalized/generateLexicalRichText.js'
import { textToLexicalJSON } from './collections/LexicalLocalized/textToLexicalJSON.js'
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
          lexicalBlocksLocalized: textToLexicalJSON({ text: 'some text' }),
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
})
