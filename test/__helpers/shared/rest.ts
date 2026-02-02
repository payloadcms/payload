/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PaginatedDocs, TypedUser, Where } from 'payload'

import * as qs from 'qs-esm'

import { devUser } from '../credentials.js'

type Args = {
  defaultSlug: string
  serverURL: string
}

type LoginArgs = {
  collection: string
  email: string
  password: string
}

type LogoutArgs = {
  collection: string
}

type CreateArgs<T = any> = {
  auth?: boolean
  data: T
  file?: boolean
  slug?: string
}

type FindArgs = {
  auth?: boolean
  depth?: number
  limit?: number
  page?: number
  query?: Where
  slug?: string
  sort?: string
}

type FindByIDArgs = {
  auth?: boolean
  id: number | string
  options?: {
    depth?: number
    limit?: number
    page?: number
  }
  query?: Where
  slug?: string
}

type UpdateArgs<T = any> = {
  auth?: boolean
  data: Partial<T>
  id: string
  query?: any
  slug?: string
}

type UpdateManyArgs<T = any> = {
  auth?: boolean
  data: Partial<T>
  slug?: string
  where: any
}

type DeleteArgs = {
  auth?: boolean
  id: string
  slug?: string
}

type DeleteManyArgs = {
  auth?: boolean
  slug?: string
  where: any
}

type FindGlobalArgs<T = any> = {
  auth?: boolean
  slug?: string
}

type UpdateGlobalArgs<T = any> = {
  auth?: boolean
  data: Partial<T>
  slug?: string
}

type DocResponse<T> = {
  doc: T
  errors?: { data: any; message: string; name: string }[]
  status: number
}

type DocsResponse<T> = {
  docs: T[]
  errors?: { data: any; id: number | string; message: string; name: string }[]
  status: number
}

const headers = {
  Authorization: '',
  'Content-Type': 'application/json',
}

type QueryResponse<T> = {
  result: PaginatedDocs<T>
  status: number
}

export class RESTClient {
  private defaultSlug: string

  private token: string

  serverURL: string

  public user: TypedUser

  constructor(args: Args) {
    this.serverURL = args.serverURL
    this.defaultSlug = args.defaultSlug
  }

  async create<T = any>(args: CreateArgs): Promise<DocResponse<T>> {
    const options = {
      body: args.file ? args.data : JSON.stringify(args.data),
      headers: {
        ...(args.file ? [] : headers),
        Authorization: '',
      },
      method: 'POST',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const slug = args.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}`, options)
    const { status } = response
    const { doc } = await response.json()
    return { doc, status }
  }

  async delete<T = any>(id: string, args?: DeleteArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
      method: 'DELETE',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}/${id}`, options)
    const { status } = response
    const doc = await response.json()
    return { doc, status }
  }

  async deleteMany<T = any>(args: DeleteManyArgs): Promise<DocsResponse<T>> {
    const { where } = args
    const options = {
      headers: { ...headers },
      method: 'DELETE',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const formattedQs = qs.stringify(
      {
        ...(where ? { where } : {}),
      },
      {
        addQueryPrefix: true,
      },
    )

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}${formattedQs}`, options)
    const { status } = response
    const json = await response.json()
    return { docs: json.docs, errors: json.errors, status }
  }

  async endpoint<T = any>(
    path: string,
    method = 'GET',
    params: any = undefined,
  ): Promise<{ data: T; status: number }> {
    const options = {
      body: JSON.stringify(params),
      headers: { ...headers },
      method,
    }

    const response = await fetch(`${this.serverURL}${path}`, options)
    const { status } = response
    const data = await response.json()
    return { data, status }
  }

  async endpointWithAuth<T = any>(
    path: string,
    method = 'GET',
    params: any = undefined,
  ): Promise<{ data: T; status: number }> {
    const options = {
      body: JSON.stringify(params),
      headers: { ...headers },
      method,
    }

    if (this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const response = await fetch(`${this.serverURL}${path}`, options)
    const { status } = response
    const data = await response.json()
    return { data, status }
  }

  async find<T = any>(args?: FindArgs): Promise<QueryResponse<T>> {
    const options = {
      headers: { ...headers },
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const whereQuery = qs.stringify(
      {
        ...(args?.query ? { where: args.query } : {}),
        limit: args?.limit,
        page: args?.page,
        sort: args?.sort,
      },
      {
        addQueryPrefix: true,
      },
    )

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}${whereQuery}`, options)
    const { status } = response
    const result = await response.json()
    if (result.errors) {
      throw new Error(result.errors[0].message)
    }
    return { result, status }
  }

  async findByID<T = any>(args: FindByIDArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const slug = args?.slug || this.defaultSlug
    const formattedOpts = qs.stringify(args?.options || {}, { addQueryPrefix: true })
    const response = await fetch(
      `${this.serverURL}/api/${slug}/${args.id}${formattedOpts}`,
      options,
    )
    const { status } = response
    const doc = await response.json()
    return { doc, status }
  }

  async findGlobal<T = any>(args?: FindGlobalArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/globals/${slug}`, options)
    const { status } = response
    const doc = await response.json()
    return { doc, status }
  }

  async login(incomingArgs?: LoginArgs): Promise<string> {
    const args = incomingArgs ?? {
      collection: 'users',
      email: devUser.email,
      password: devUser.password,
    }

    const response = await fetch(`${this.serverURL}/api/${args.collection}/login`, {
      body: JSON.stringify({
        email: args.email,
        password: args.password,
      }),
      headers,
      method: 'POST',
    })

    const { user } = await response.json()

    let token = user.token

    // If the token is not in the response body, then we can extract it from the cookies
    if (!token) {
      const setCookie = response.headers.get('Set-Cookie')
      const tokenMatchResult = setCookie?.match(/payload-token=(?<token>.+?);/)
      token = tokenMatchResult?.groups?.token
    }

    this.user = user
    this.token = token

    return token
  }

  async logout(incomingArgs?: LogoutArgs): Promise<void> {
    const args = incomingArgs ?? {
      collection: 'users',
    }

    await fetch(`${this.serverURL}/api/${args.collection}/logout`, {
      headers,
      method: 'POST',
    })

    this.token = ''
  }

  async update<T = any>(args: UpdateArgs<T>): Promise<DocResponse<T>> {
    const { id, data, query } = args

    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'PATCH',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const formattedQs = qs.stringify(query)
    const slug = args.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}/${id}${formattedQs}`, options)
    const { status } = response
    const json = await response.json()
    return { doc: json.doc, errors: json.errors, status }
  }

  async updateGlobal<T = any>(args: UpdateGlobalArgs): Promise<DocResponse<T>> {
    const { data } = args
    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'POST',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/globals/${slug}`, options)
    const { status } = response
    const { result } = await response.json()
    return { doc: result, status }
  }

  async updateMany<T = any>(args: UpdateManyArgs<T>): Promise<DocsResponse<T>> {
    const { data, where } = args
    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'PATCH',
    }

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`
    }

    const formattedQs = qs.stringify(
      {
        ...(where ? { where } : {}),
      },
      {
        addQueryPrefix: true,
      },
    )

    const slug = args?.slug || this.defaultSlug
    const response = await fetch(`${this.serverURL}/api/${slug}${formattedQs}`, options)
    const { status } = response
    const json = await response.json()
    return { docs: json.docs, errors: json.errors, status }
  }
}
