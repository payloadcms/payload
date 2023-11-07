import type { SerializedEditorState } from 'lexical'

import { GraphQLClient } from 'graphql-request'

import type { SanitizedConfig } from '../../packages/payload/src/config/types'
import type { PaginatedDocs } from '../../packages/payload/src/database/types'
import type {
  SerializedLinkNode,
  SerializedRelationshipNode,
  SerializedUploadNode,
} from '../../packages/richtext-lexical/src'
import type { RichTextField } from './payload-types'

import payload from '../../packages/payload/src'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import configPromise from '../uploads/config'
import { arrayDoc } from './collections/Array'
import { lexicalRichTextDocData } from './collections/Lexical/data'
import { richTextDocData } from './collections/RichText/data'
import { generateLexicalRichText } from './collections/RichText/generateLexicalRichText'
import { textDoc } from './collections/Text'
import { clearAndSeedEverything } from './seed'
import {
  arrayFieldsSlug,
  lexicalFieldsSlug,
  richTextFieldsSlug,
  textFieldsSlug,
  uploadsSlug,
} from './slugs'

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

    client = new RESTClient(config, { defaultSlug: richTextFieldsSlug, serverURL })
    const graphQLURL = `${serverURL}${config.routes.api}${config.routes.graphQL}`
    graphQLClient = new GraphQLClient(graphQLURL)
    token = await client.login()
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    client = new RESTClient(config, { defaultSlug: richTextFieldsSlug, serverURL })
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
              equals: richTextDocData.title,
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

    it('should populate respect depth parameter and populate link node relationship', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          where: {
            title: {
              equals: richTextDocData.title,
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
      expect(linkNode.fields.doc.value.items[1].text).toStrictEqual(arrayDoc.items[1].text)
    })

    it('should populate relationship node', async () => {
      const richTextDoc: RichTextField = (
        await payload.find({
          collection: richTextFieldsSlug,
          where: {
            title: {
              equals: richTextDocData.title,
            },
          },
          depth: 1,
        })
      ).docs[0] as never

      const relationshipNode: SerializedRelationshipNode =
        richTextDoc.lexicalCustomFields.root.children.find((node) => node.type === 'relationship')

      console.log('relationshipNode:', relationshipNode)

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
        RichTextFields: PaginatedDocs<RichTextField>
      } = await graphQLClient.request(
        query,
        {},
        {
          Authorization: `JWT ${token}`,
        },
      )

      const { docs } = response.RichTextFields

      const uploadNode: SerializedUploadNode = docs[0].lexicalCustomFields.root.children.find(
        (node) => node.type === 'upload',
      )
      expect(uploadNode.value.media.filename).toStrictEqual('payload.png')
    })
  })

  describe('advanced - blocks', () => {
    it('should allow querying on lexical content with blocks field', async () => {
      const lexicalDoc: RichTextField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          where: {
            title: {
              equals: lexicalRichTextDocData.title,
            },
          },
          depth: 0,
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc?.lexicalCustomFields as never

      console.log('lexicalField:', lexicalField)

      expect(richTextDoc?.lexicalCustomFields).toStrictEqual(
        JSON.parse(
          JSON.stringify(generateLexicalRichText())
            .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${createdArrayDocID}`)
            .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${createdJPGDocID}`)
            .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${createdTextDocID}`),
        ),
      )
    })
  })
})
