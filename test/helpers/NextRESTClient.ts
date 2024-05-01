import type { SanitizedConfig } from 'payload/config'
import type { Populate, Select, Where } from 'payload/types'
import type { ParsedQs } from 'qs'

import {
  REST_DELETE as createDELETE,
  REST_GET as createGET,
  REST_PATCH as createPATCH,
  REST_POST as createPOST,
} from '@payloadcms/next/routes'
import { GRAPHQL_POST as createGraphqlPOST } from '@payloadcms/next/routes'
import QueryString from 'qs'

import { devUser } from '../credentials.js'

type ValidPath = `/${string}`
type RequestOptions = {
  auth?: boolean
  query?: {
    depth?: number
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    populate?: Populate
    select?: Select
    sort?: string
    where?: Where
  }
}

type FileArg = {
  file?: Omit<File, 'webkitRelativePath'>
}

function generateQueryString(query: RequestOptions['query'], params: ParsedQs): string {
  return QueryString.stringify(
    {
      ...(params || {}),
      ...(query || {}),
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

  private token: string

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

  private buildHeaders(options: RequestInit & RequestOptions & FileArg): Headers {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }
    const headers = new Headers({
      ...(options?.file
        ? {
            'Content-Length': options.file.size.toString(),
          }
        : defaultHeaders),
      ...(options?.headers || {}),
    })

    if (options.auth !== false && this.token) {
      headers.set('Authorization', `JWT ${this.token}`)
    }

    return headers
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

  async DELETE(path: ValidPath, options: RequestInit & RequestOptions = {}): Promise<Response> {
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      method: 'DELETE',
      headers: this.buildHeaders(options),
    })
    return this._DELETE(request, { params: { slug } })
  }

  async GET(
    path: ValidPath,
    options: Omit<RequestInit, 'body'> & RequestOptions = {},
  ): Promise<Response> {
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      method: 'GET',
      headers: this.buildHeaders(options),
    })
    return this._GET(request, { params: { slug } })
  }

  async GRAPHQL_POST(options: RequestInit & RequestOptions): Promise<Response> {
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, {})
    const request = new Request(
      `${this.serverURL}${this.config.routes.api}${this.config.routes.graphQL}${queryParams}`,
      {
        ...rest,
        method: 'POST',
        headers: this.buildHeaders(options),
      },
    )
    return this._GRAPHQL_POST(request)
  }

  async PATCH(path: ValidPath, options: RequestInit & RequestOptions & FileArg): Promise<Response> {
    const { url, slug, params } = this.generateRequestParts(path)
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      method: 'PATCH',
      headers: this.buildHeaders(options),
    })
    return this._PATCH(request, { params: { slug } })
  }

  async POST(
    path: ValidPath,
    options: RequestInit & RequestOptions & FileArg = {},
  ): Promise<Response> {
    const { url, slug, params } = this.generateRequestParts(path)
    const queryParams = generateQueryString({}, params)
    const request = new Request(`${url}${queryParams}`, {
      ...options,
      method: 'POST',
      headers: this.buildHeaders(options),
    })
    return this._POST(request, { params: { slug } })
  }

  async login({
    slug,
    credentials,
  }: {
    credentials?: {
      email: string
      password: string
    }
    slug: string
  }): Promise<{ [key: string]: any }> {
    const response = await this.POST(`/${slug}/login`, {
      body: JSON.stringify(
        credentials ? { ...credentials } : { email: devUser.email, password: devUser.password },
      ),
    })
    const result = await response.json()

    this.token = result.token

    if (!result.token) {
      // If the token is not in the response body, then we can extract it from the cookies
      const setCookie = response.headers.get('Set-Cookie')
      const tokenMatchResult = setCookie?.match(/payload-token=(?<token>.+?);/)
      this.token = tokenMatchResult?.groups?.token
    }

    return result
  }
}
