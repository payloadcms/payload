import config from 'payload-config'
import { GraphQLError } from 'graphql'
import { createSchema, createYoga } from 'graphql-yoga'
import httpStatus from 'http-status'
import type { Payload, CollectionAfterErrorHook } from 'payload/types'
import type { GraphQLFormattedError } from 'graphql'
import { createPayloadRequest } from '../../utilities/createPayloadRequest'

const handleError = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: CollectionAfterErrorHook,
): Promise<GraphQLFormattedError> => {
  const status = err.originalError.status || httpStatus.INTERNAL_SERVER_ERROR
  let errorMessage = err.message

  payload.logger.error(err.stack)

  // Internal server errors can contain anything, including potentially sensitive data.
  // Therefore, error details will be hidden from the response unless `config.debug` is `true`
  if (!debug && status === httpStatus.INTERNAL_SERVER_ERROR) {
    errorMessage = 'Something went wrong.'
  }

  let response: GraphQLFormattedError = {
    extensions: {
      name: err?.originalError?.name || undefined,
      data: (err && err.originalError && err.originalError.data) || undefined,
      stack: debug ? err.stack : undefined,
      statusCode: status,
    },
    locations: err.locations,
    message: errorMessage,
    path: err.path,
  }

  if (afterErrorHook) {
    ;({ response } = (await afterErrorHook(err, response, null, null)) || { response })
  }

  return response
}

export const POST = async (request: Request) => {
  const originalRequest = request.clone()
  const req = await createPayloadRequest({
    request,
    config,
  })
  const copyOfSchema = req.payload.schema

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'This is the `greetings` field of the root `Query` type',
      },
    },
  })
  const apiResponse = await createYoga({
    schema: copyOfSchema,

    // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
    graphqlEndpoint: '/api/graphql',

    // Yoga needs to know how to create a valid Next response
    fetchAPI: { Response },
  })(originalRequest)
  console.log('schema', Object.keys(schema))
  console.log('payload schema', typeof req.payload.schema)

  return new Response(apiResponse.body, {
    headers: {
      ...apiResponse.headers,
    },
  })
}
