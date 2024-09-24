'use client'

import { GraphiQL } from 'graphiql'
import 'graphiql/graphiql.css'
import React from 'react'

export const baseClass = 'graphql-playground'

export const GraphQLPlaygroundClient: React.FC<{ url: string }> = ({ url }) => {
  const fetcher = async (graphQLParams) => {
    const response = await fetch(url, {
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    return response.json()
  }

  return <GraphiQL className={baseClass} fetcher={fetcher} />
}
