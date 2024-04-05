import type { SendMailOptions } from 'nodemailer'
import type { PaginatedDocs } from 'payload/database'

import type {
  CreateArgs,
  DeleteArgs,
  FetchOptions,
  FindArgs,
  GeneratedTypes,
  UpdateArgs,
} from './types.js'

type Args = {
  serverURL: string
}

export class PayloadTestSDK<TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>> {
  private fetch = async <T>({ jwt, reduceJSON, args, method }: FetchOptions): Promise<T> => {
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

  delete = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: DeleteArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      method: 'delete',
      args,
      jwt,
    })
  }

  find = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: FindArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      method: 'find',
      args,
      jwt,
    })
  }

  sendEmail = async ({ jwt, ...args }: { jwt?: string } & SendMailOptions): Promise<unknown> => {
    return this.fetch({
      method: 'sendEmail',
      args,
      jwt,
    })
  }

  serverURL: string

  update = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: UpdateArgs<TGeneratedTypes, T>) => {
    return this.fetch<TGeneratedTypes['collections'][T]>({
      method: 'update',
      args,
      jwt,
    })
  }

  constructor({ serverURL }: Args) {
    this.serverURL = serverURL
  }
}
