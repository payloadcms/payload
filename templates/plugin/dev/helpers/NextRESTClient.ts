import type { JoinQuery, PopulateType, SanitizedConfig, SelectType, Where } from 'payload'
import type { ParsedQs } from 'qs-esm'

import {
  REST_DELETE as createDELETE,
  REST_GET as createGET,
  GRAPHQL_POST as createGraphqlPOST,
  REST_PATCH as createPATCH,
  REST_POST as createPOST,
  REST_PUT as createPUT,
} from '@payloadcms/next/routes'
import * as qs from 'qs-esm'

import { devUser } from './credentials.js'

type ValidPath = `/${string}`
type RequestOptions = {
  auth?: boolean
  query?: {
    depth?: number
    fallbackLocale?: string
    joins?: JoinQuery
    limit?: number
    locale?: string
    page?: number
    populate?: PopulateType
    select?: SelectType
    sort?: string
    where?: Where
  }
}

type FileArg = {
  file?: Omit<File, 'webkitRelativePath'>
}

function generateQueryString(query: RequestOptions['query'], params?: ParsedQs): string {
  return qs.stringify(
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
  private _DELETE: (
    request: Request,
    args: { params: Promise<{ slug: string[] }> },
  ) => Promise<Response>

  private _GET: (
    request: Request,
    args: { params: Promise<{ slug: string[] }> },
  ) => Promise<Response>

  private _GRAPHQL_POST: (request: Request) => Promise<Response>

  private _PATCH: (
    request: Request,
    args: { params: Promise<{ slug: string[] }> },
  ) => Promise<Response>

  private _POST: (
    request: Request,
    args: { params: Promise<{ slug: string[] }> },
  ) => Promise<Response>

  private _PUT: (
    request: Request,
    args: { params: Promise<{ slug: string[] }> },
  ) => Promise<Response>

  private readonly config: SanitizedConfig

  private token?: string

  serverURL: string = 'http://localhost:3000'

  constructor(config: SanitizedConfig) {
    this.config = config
    if (config?.serverURL) {
      this.serverURL = config.serverURL
    }
    this._GET = createGET(config)
    this._POST = createPOST(config)
    this._DELETE = createDELETE(config)
    this._PATCH = createPATCH(config)
    this._PUT = createPUT(config)
    this._GRAPHQL_POST = createGraphqlPOST(config)
  }

  private buildHeaders(options: FileArg & RequestInit & RequestOptions): Headers {
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
    if (options.auth === false) {
      headers.set('DisableAutologin', 'true')
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
      slug: slugs.split('/'),
      params: params ? qs.parse(params) : undefined,
      url,
    }
  }

  async DELETE(path: ValidPath, options: RequestInit & RequestOptions = {}): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      headers: this.buildHeaders(options),
      method: 'DELETE',
    })
    return this._DELETE(request, { params: Promise.resolve({ slug }) })
  }

  async GET(
    path: ValidPath,
    options: Omit<RequestInit, 'body'> & RequestOptions = {},
  ): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      headers: this.buildHeaders(options),
      method: 'GET',
    })
    return this._GET(request, { params: Promise.resolve({ slug }) })
  }

  async GRAPHQL_POST(options: RequestInit & RequestOptions): Promise<Response> {
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, {})
    const request = new Request(
      `${this.serverURL}${this.config.routes.api}${this.config.routes.graphQL}${queryParams}`,
      {
        ...rest,
        headers: this.buildHeaders(options),
        method: 'POST',
      },
    )
    return this._GRAPHQL_POST(request)
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
  }): Promise<{ [key: string]: unknown }> {
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

  async PATCH(path: ValidPath, options: FileArg & RequestInit & RequestOptions): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      headers: this.buildHeaders(options),
      method: 'PATCH',
    })
    return this._PATCH(request, { params: Promise.resolve({ slug }) })
  }

  async POST(
    path: ValidPath,
    options: FileArg & RequestInit & RequestOptions = {},
  ): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const queryParams = generateQueryString({}, params)
    const request = new Request(`${url}${queryParams}`, {
      ...options,
      headers: this.buildHeaders(options),
      method: 'POST',
    })
    return this._POST(request, { params: Promise.resolve({ slug }) })
  }

  async PUT(path: ValidPath, options: FileArg & RequestInit & RequestOptions): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const { query, ...rest } = options
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      headers: this.buildHeaders(options),
      method: 'PUT',
    })
    return this._PUT(request, { params: Promise.resolve({ slug }) })
  }
}
