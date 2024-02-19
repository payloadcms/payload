import type { Where } from 'payload/types'

import QueryString from 'qs'

import type { SanitizedConfig } from '../../packages/payload/src/config/types'

import { GRAPHQL_POST as createGraphqlPOST } from '../../packages/next/src/routes/graphql'
import {
  DELETE as createDELETE,
  GET as createGET,
  PATCH as createPATCH,
  POST as createPOST,
} from '../../packages/next/src/routes/rest'

type ValidPath = `/${string}`
type RequestQuery = {
  query?: {
    limit?: number
    page?: number
    sort?: string
    where?: Where
  }
}

function generateQueryString(query: RequestQuery['query']): string {
  return QueryString.stringify(
    {
      ...(query?.where ? { where: query.where } : {}),
      limit: query?.limit,
      page: query?.page,
      sort: query?.sort,
    },
    {
      addQueryPrefix: true,
    },
  )
}

export class NextRESTClient {
  private _DELETE: (request: Request, args: { params: { slug: string[] } }) => Promise<Response>

  private _GET: (request: Request, args: { params: { slug: string[] } }) => Promise<Response>

  private _GRAPHQL_POST: (request: Request) => Promise<Response>

  private _PATCH: (request: Request, args: { params: { slug: string[] } }) => Promise<Response>

  private _POST: (request: Request, args: { params: { slug: string[] } }) => Promise<Response>

  private readonly config: SanitizedConfig

  serverURL: string = 'http://localhost:3000'

  constructor(config: SanitizedConfig) {
    this.config = config
    if (config?.serverURL) this.serverURL = config.serverURL
    this._GET = createGET(config)
    this._POST = createPOST(config)
    this._DELETE = createDELETE(config)
    this._PATCH = createPATCH(config)
    this._GRAPHQL_POST = createGraphqlPOST(config)
  }

  private generateRequestParts(path: string): {
    slug: string[]
    url: string
  } {
    const safePath = path.slice(1)
    const slug = safePath.split('/')
    const url = `${this.serverURL}${this.config.routes.api}/${safePath}`
    return {
      url,
      slug,
    }
  }

  async DELETE(path: ValidPath, options: RequestInit & RequestQuery = {}): Promise<Response> {
    const { url, slug } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const whereQuery = generateQueryString(query)

    const request = new Request(`${url}${whereQuery}`, {
      ...rest,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    })
    return this._DELETE(request, { params: { slug } })
  }

  async GET(
    path: ValidPath,
    options: Omit<RequestInit, 'body'> & RequestQuery = {},
  ): Promise<Response> {
    const { url, slug } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const whereQuery = generateQueryString(query)

    const request = new Request(`${url}${whereQuery}`, {
      ...rest,
      method: 'GET',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      }),
    })
    return this._GET(request, { params: { slug } })
  }

  async GRAPHQL_POST(options: RequestInit): Promise<Response> {
    const request = new Request(
      `${this.serverURL}${this.config.routes.api}${this.config.routes.graphQL}`,
      {
        ...options,
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        }),
      },
    )
    return this._GRAPHQL_POST(request)
  }

  async PATCH(path: ValidPath, options: RequestInit & RequestQuery): Promise<Response> {
    const { url, slug } = this.generateRequestParts(path)
    const { query, ...rest } = options
    const whereQuery = generateQueryString(query)

    const request = new Request(`${url}${whereQuery}`, {
      ...rest,
      method: 'PATCH',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      }),
    })
    return this._PATCH(request, { params: { slug } })
  }

  async POST(path: ValidPath, options: RequestInit = {}): Promise<Response> {
    const { url, slug } = this.generateRequestParts(path)

    const request = new Request(url, {
      ...options,
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      }),
    })
    return this._POST(request, { params: { slug } })
  }
}
