import type { AdminViewProps } from 'payload'

import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { NotFoundView } from '../NotFound/index.js'
import { GraphQLPlaygroundClient } from './index.client.js'
export const loginBaseClass = 'login'

export { generateGraphQLPlaygroundMetadata } from './meta.js'
export const GraphQLPlayground: React.FC<AdminViewProps> = (props) => {
  const { initPageResult } = props
  const { req } = initPageResult

  const {
    payload: { config },
  } = req

  const {
    routes: { api, graphQL },
    serverURL,
  } = config

  const graphqlEndpoint = `${serverURL}${api}${graphQL}`

  if (
    req.payload.config.graphQL.disable ||
    (req.payload.config.graphQL.disablePlaygroundInProduction &&
      process.env.NODE_ENV === 'production') ||
    process.env.NODE_ENV === 'production'
  ) {
    notFound()
  }

  return <GraphQLPlaygroundClient url={graphqlEndpoint} />
}
