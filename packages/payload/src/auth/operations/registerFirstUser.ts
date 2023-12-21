import type { MarkOptional } from 'ts-essentials'

import type { GeneratedTypes } from '../../'
import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../types'

import { Forbidden } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

export type Arguments<T extends { [field: number | string | symbol]: unknown }> = {
  collection: Collection
  data: MarkOptional<T, 'createdAt' | 'id' | 'sizes' | 'updatedAt'> & {
    email: string
    password: string
  }
  req: PayloadRequest
}

export type Result<T> = {
  exp?: number
  token?: string
  user?: T
}

export const registerFirstUserOperation = async <TSlug extends keyof GeneratedTypes['collections']>(
  args: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<Result<GeneratedTypes['collections'][TSlug]>> => {
  const {
    collection: {
      config,
      config: {
        auth: { verify },
        slug,
      },
    },
    data,
    req,
    req: { payload },
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    const doc = await payload.db.findOne({
      collection: config.slug,
      req,
    })

    if (doc) throw new Forbidden(req.t)

    // /////////////////////////////////////
    // Register first user
    // /////////////////////////////////////

    const result = await payload.create<TSlug>({
      collection: slug as TSlug,
      data,
      overrideAccess: true,
      req,
    })

    // auto-verify (if applicable)
    if (verify) {
      await payload.update({
        id: result.id,
        collection: slug,
        data: {
          _verified: true,
        },
        req,
      })
    }

    // /////////////////////////////////////
    // Log in new user
    // /////////////////////////////////////

    const { exp, token } = await payload.login({
      ...args,
      collection: slug,
      req,
    })

    if (shouldCommit) await commitTransaction(req)

    return {
      exp,
      token,
      user: result,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
