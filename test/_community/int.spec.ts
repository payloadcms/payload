import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { stitchSchemas } from '@graphql-tools/stitch'
import express from 'express'

import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { postsSlug } from './collections/Posts'

require('isomorphic-fetch')

let apiUrl

const headers = {
  'Content-Type': 'application/json',
}
describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const app = express()
    const { serverURL, payload } = await initPayloadTest({
      __dirname,
      init: {
        express: app,
      },
    })

    const schema1 = makeExecutableSchema({
      resolvers: { Query: { hello: () => 'Hello world!' } },
      typeDefs: `type Query { hello: String }`,
    })
    const schema2 = payload.schema

    const stitchedSchema = stitchSchemas({
      subschemas: [schema1, schema2],
    })
    const server = new ApolloServer({ schema: stitchedSchema })
    await server.start()

    app.use('/merged-graphql', express.json(), expressMiddleware(server))

    apiUrl = `${serverURL}/merged-graphql`
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

  it('graphQL query', async () => {
    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'query Test { hello Users { docs { id } } }',
        operationName: 'Test',
      }),
      headers,
    }).then((res) => res.json())

    expect(response['data']['hello']).toEqual('Hello world!')
    expect(response['data']['Users']).not.toBeNull()
  })
})
