import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { Forbidden } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';

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
      Model,
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

  const count = await Model.countDocuments({});

  if (count >= 1) throw new Forbidden(req.t);

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

  return {
    message: 'Registered and logged in successfully. Welcome!',
    user: resultToReturn,
  };
}

export default registerFirstUser;
