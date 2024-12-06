import type { PaginatedDocs, SendEmailOptions } from 'payload'

import type {
  CreateArgs,
  DeleteArgs,
  FetchOptions,
  FindArgs,
  GeneratedTypes,
  LoginArgs,
  UpdateArgs,
  UpdateGlobalArgs,
} from './types.js'

type Args = {
  serverURL: string
}

export class PayloadTestSDK<TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>> {
  private fetch = async <T>({ jwt, reduceJSON, args, operation }: FetchOptions): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (jwt) {
      headers.Authorization = `JWT ${jwt}`
    }

    const json: T = await fetch(`${this.serverURL}/api/local-api`, {
      method: 'post',
      headers,
      body: JSON.stringify({
        args,
        operation,
      }),
    }).then((res) => res.json())

    if (reduceJSON) {
      return reduceJSON<T>(json)
    }

    return json
  }

  create = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: CreateArgs<TGeneratedTypes, T>) => {
    return this.fetch<TGeneratedTypes['collections'][T]>({
      operation: 'create',
      args,
      jwt,
    })
  }

  delete = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: DeleteArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      operation: 'delete',
      args,
      jwt,
    })
  }

  find = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: FindArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      operation: 'find',
      args,
      jwt,
    })
  }

  findVersions = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: FindArgs<TGeneratedTypes, T>) => {
    return this.fetch<PaginatedDocs<TGeneratedTypes['collections'][T]>>({
      operation: 'findVersions',
      args,
      jwt,
    })
  }

  login = async <T extends keyof TGeneratedTypes['collections']>({
    jwt,
    ...args
  }: LoginArgs<TGeneratedTypes, T>) => {
    return this.fetch<TGeneratedTypes['collections'][T]>({
      operation: 'login',
      args,
      jwt,
    })
  }

  sendEmail = async ({ jwt, ...args }: { jwt?: string } & SendEmailOptions): Promise<unknown> => {
    return this.fetch({
      operation: 'sendEmail',
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
      operation: 'update',
      args,
      jwt,
    })
  }

  updateGlobal = async <T extends keyof TGeneratedTypes['globals']>({
    jwt,
    ...args
  }: UpdateGlobalArgs<TGeneratedTypes, T>) => {
    return this.fetch<TGeneratedTypes['collections'][T]>({
      operation: 'updateGlobal',
      args,
      jwt,
    })
  }

  constructor({ serverURL }: Args) {
    this.serverURL = serverURL
  }
}
