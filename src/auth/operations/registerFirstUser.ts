import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { Forbidden } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';

export type Arguments<T extends { [field: string | number | symbol]: unknown }> = {
  collection: Collection
  data: MarkOptional<T, 'id' | 'updatedAt' | 'createdAt' | 'sizes'> & {
    email: string
    password: string
  }
  req: PayloadRequest
  res: Response
}

export type Result<T> = {
  message: string,
  user: T
}

async function registerFirstUser<TSlug extends keyof GeneratedTypes['collections']>(
  args: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<Result<GeneratedTypes['collections'][TSlug]>> {
  const {
    collection: {
      config,
      config: {
        slug,
        auth: {
          verify,
        },
      },
    },
    req: {
      payload,
    },
    req,
    data,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);
    const { transactionID } = req;

    const doc = await payload.db.findOne({
      collection: config.slug,
      transactionID,
    });

    if (doc) throw new Forbidden(req.t);

    // /////////////////////////////////////
    // Register first user
    // /////////////////////////////////////

    const result = await payload.create<TSlug>({
      req,
      collection: slug as TSlug,
      data,
      overrideAccess: true,
    });

    // auto-verify (if applicable)
    if (verify) {
      await payload.update({
        id: result.id,
        collection: slug,
        data: {
          _verified: true,
        },
      });
    }

    // /////////////////////////////////////
    // Log in new user
    // /////////////////////////////////////

    const { token } = await payload.login({
      ...args,
      collection: slug,
    });

    const resultToReturn = {
      ...result,
      token,
    };

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return {
      message: 'Registered and logged in successfully. Welcome!',
      user: resultToReturn,
    };
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default registerFirstUser;
