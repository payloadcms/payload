import { Response } from 'express';
import { Document } from '../../types';
import { Forbidden } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../../collections/config/types';

export type Arguments = {
  collection: Collection
  data: {
    email: string
    password: string
  }
  req: PayloadRequest
  res: Response
}

export type Result = {
  message: string,
  user: Document
}

async function registerFirstUser(args: Arguments): Promise<Result> {
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

  if (count >= 1) throw new Forbidden();

  // /////////////////////////////////////
  // Register first user
  // /////////////////////////////////////

  const result = await payload.create<TypeWithID>({
    req,
    collection: slug,
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
