export {
  GET as REST_GET,
  POST as REST_POST,
  DELETE as REST_DELETE,
  PATCH as REST_PATCH,
} from './rest'

export { GET as GET_STATIC_FILE } from './rest/[collection]/file/[filename]/route'

export { GRAPHQL_POST, GRAPHQL_PLAYGROUND_GET } from './graphql'
