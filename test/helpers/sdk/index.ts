import type { PaginatedDocs } from 'payload/database'

import type { CreateArgs, FetchOptions, FindArgs, GeneratedTypes } from './types.js'

type Args = {
  serverURL: string
}

export class PayloadTestSDK<TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>> {
  create = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: CreateArgs<TGeneratedTypes, T>) => {
    return this.fetch<TGeneratedTypes['collections'][T]>({
      method: 'create',
      args,
      jwt,
    })
  }

  fetch = async <T>({ jwt, reduceJSON, args, method }: FetchOptions): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (jwt) headers.Authorization = `JWT ${jwt}`

    const json: T = await fetch(`${this.serverURL}/api/local-api`, {
      method: 'post',
      headers,
      body: JSON.stringify({
        args,
        method,
      }),
    }).then((res) => res.json())

    if (reduceJSON) return reduceJSON<T>(json)

    return json
  }

  find = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: FindArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      method: 'find',
      args,
      jwt,
      reduceJSON: (json) => json.docs,
    })
  }

  serverURL: string

  constructor({ serverURL }: Args) {
    this.serverURL = serverURL
  }
}
