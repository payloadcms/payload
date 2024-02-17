import type { Where } from 'payload/types'
import type { ParsedQs } from 'qs'

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

function generateQueryString(query: RequestQuery['query'], params: ParsedQs): string {
  const { where, limit, page, sort, ...rest } = params || {}
  const whereFilter = query?.where || where
  return QueryString.stringify(
    {
      ...(rest || {}),
      ...(whereFilter ? { where: whereFilter } : {}),
      limit: query?.limit || limit || undefined,
      page: query?.page || page || undefined,
      sort: query?.sort || sort || undefined,
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

  private generateRequestParts(path: ValidPath): {
    params?: ParsedQs
    slug: string[]
    url: string
  } {
    const [slugs, params] = path.slice(1).split('?')
    const url = `${this.serverURL}${this.config.routes.api}/${slugs}`

    return {
      url,
      slug: slugs.split('/'),
      params: params ? QueryString.parse(params) : undefined,
    }
  }

  async DELETE(path: ValidPath, options: RequestInit & RequestQuery = {}): Promise<Response> {
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
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
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
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
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
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
    const { url, slug, params } = this.generateRequestParts(path)
    const queryParams = generateQueryString({}, params)

    const request = new Request(`${url}${queryParams}`, {
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
