import type { SerializedEditorState } from 'lexical'

import { GraphQLClient } from 'graphql-request'

import type { SanitizedConfig } from '../../packages/payload/src/config/types'
import type { SerializedLinkNode } from '../../packages/richtext-lexical/src'
import type { RichTextField } from './payload-types'

import payload from '../../packages/payload/src'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import configPromise from '../uploads/config'
import { generateLexicalRichText } from './collections/RichText/generateLexicalRichText'
import { clearAndSeedEverything } from './seed'
import { arrayFieldsSlug, richTextFieldsSlug, textFieldsSlug, uploadsSlug } from './slugs'

let client: RESTClient
let graphQLClient: GraphQLClient
let serverURL: string
let config: SanitizedConfig
let token: string

let createdArrayDocID: string = null
let createdJPGDocID: string = null
let createdTextDocID: string = null

describe('Lexical', () => {
  beforeAll(async () => {
    ;({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }))
    config = await configPromise

    client = new RESTClient(config, { defaultSlug: 'rich-text-fields', serverURL })
    const graphQLURL = `${serverURL}${config.routes.api}${config.routes.graphQL}`
    graphQLClient = new GraphQLClient(graphQLURL)
    token = await client.login()
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    client = new RESTClient(config, { defaultSlug: 'rich-text-fields', serverURL })
    await client.login()

    const _createdArrayDocID = (
      await payload.find({
        collection: arrayFieldsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })
    ).docs[0].id as string

    createdArrayDocID =
      payload.db.defaultIDType === 'number' ? _createdArrayDocID : `"${_createdArrayDocID}"`

    const _createdJPGDocID = (
      await payload.find({
        collection: uploadsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })
    ).docs[0].id as string

    createdJPGDocID =
      payload.db.defaultIDType === 'number' ? _createdJPGDocID : `"${_createdJPGDocID}"`

    const _createdTextDocID = (
      await payload.find({
        collection: textFieldsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })
    ).docs[0].id as string

    createdTextDocID =
      payload.db.defaultIDType === 'number' ? _createdTextDocID : `"${_createdTextDocID}"`
  })

  describe('basic', () => {
    it('should allow querying on lexical content', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          where: {
            title: {
              equals: 'Rich Text',
            },
          },
          depth: 0,
        })
      ).docs[0] as never

      expect(richTextDoc?.lexicalCustomFields).toStrictEqual(
        JSON.parse(
          JSON.stringify(generateLexicalRichText())
            .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${createdArrayDocID}`)
            .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${createdJPGDocID}`)
            .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${createdTextDocID}`),
        ),
      )
    })

    it('should populate relationships and respect depth parameter', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          where: {
            title: {
              equals: 'Rich Text',
            },
          },
          depth: 1,
        })
      ).docs[0] as never

      const seededDocument = JSON.parse(
        JSON.stringify(generateLexicalRichText())
          .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${createdArrayDocID}`)
          .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${createdJPGDocID}`)
          .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${createdTextDocID}`),
      )

      expect(richTextDoc?.lexicalCustomFields).not.toStrictEqual(seededDocument) // The whole seededDocument should not match, as richTextDoc should now contain populated documents not present in the seeded document
      expect(richTextDoc?.lexicalCustomFields).toMatchObject(seededDocument) // subset of seededDocument should match

      const lexical: SerializedEditorState = richTextDoc?.lexicalCustomFields as never

      const linkNode: SerializedLinkNode = lexical.root.children[1].children[3]
      expect(linkNode.fields.doc.value.items[1].text).toBe('second row')
    })
  })
})
