import type { AdminViewServerProps } from 'payload'

import React from 'react'

export function SearchParamsView({ searchParams }: AdminViewServerProps) {
  return <pre id="search-params-view-output">{JSON.stringify(searchParams ?? {})}</pre>
}
