import type { SanitizedConfig } from 'payload/types'

import React from 'react'

import { initPage } from '../../utilities/initPage'
import { Login } from '../Login'

type Args = {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const views = {
  login: Login,
}

export const RootPage = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise
  const route = `${config.routes.admin}/${params.segments.join('/')}`
  const page = await initPage({ config, route })

  const [segmentOne, segmentTwo] = params.segments

  // Catch any single-segment routes:
  // /create-first-user
  // /forgot
  // /login
  // /logout
  // /logout-inactivity
  // /unauthorized
  // /verify

  if (params.segments.length === 1 && views[segmentOne]) {
    const View = views[segmentOne]

    return <View page={page} searchParams={searchParams} />
  }

  return null
}
