export { GRAPHQL_PLAYGROUND_GET, GRAPHQL_POST } from './graphql/index.js'

export {
  DELETE as REST_DELETE,
  GET as REST_GET,
  PATCH as REST_PATCH,
  POST as REST_POST,
} from './rest/index.js'

export { GET as GET_STATIC_FILE } from './rest/[collection]/file/[filename]/route.js'
