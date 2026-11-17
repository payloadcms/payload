import type { JoinQuery, PopulateType, SanitizedConfig, SelectType, Where } from 'payload'
import type { ParsedQs } from 'qs-esm'

import * as qs from 'qs-esm'

import { devUser } from '../../credentials.js'
import { createTestRequestHandler } from './createTestRequestHandler.js'

type ValidPath = `/${string}`
type RequestOptions = {
  auth?: boolean
  query?: { [key: string]: unknown } & {
    depth?: number
    fallbackLocale?: string | string[]
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

function generateQueryString(query: RequestOptions['query'], params: ParsedQs): string {
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

export class RESTClient {
  private readonly config: SanitizedConfig

  private readonly handleRequest: ReturnType<typeof createTestRequestHandler>

  private token: string

  serverURL: string = `http://localhost:${process.env.PORT || 3000}`

  constructor(config: SanitizedConfig) {
    this.config = config
    if (config?.serverURL) {
      this.serverURL = config.serverURL
    }
    this.handleRequest = createTestRequestHandler({ config })
  }

  private buildHeaders(options: FileArg & RequestInit & RequestOptions): Headers {
    // Only set `Content-Type` to `application/json` if body is not `FormData`
    const isFormData =
      options &&
      typeof options.body !== 'undefined' &&
      typeof FormData !== 'undefined' &&
      options.body instanceof FormData

    const headers = new Headers(options.headers || {})

    if (options?.file) {
      headers.set('Content-Length', options.file.size.toString())
    }

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

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
    return this.handleRequest({ request, slug })
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
    return this.handleRequest({ request, slug })
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
    return this.handleRequest({ isGraphQL: true, request })
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

  async OPTIONS(
    path: ValidPath,
    options: Omit<RequestInit, 'body'> & RequestOptions = {},
  ): Promise<Response> {
    const { slug, params, url } = this.generateRequestParts(path)
    const { query, ...rest } = options || {}
    const queryParams = generateQueryString(query, params)

    const request = new Request(`${url}${queryParams}`, {
      ...rest,
      headers: this.buildHeaders(options),
      method: 'OPTIONS',
    })
    return this.handleRequest({ request, slug })
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

    return this.handleRequest({ request, slug })
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
    return this.handleRequest({ request, slug })
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
    return this.handleRequest({ request, slug })
  }
}
