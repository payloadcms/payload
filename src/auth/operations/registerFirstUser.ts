import { Document } from '../../types';
import { Forbidden } from '../../errors';
import { Payload } from '../..';
import { Collection } from '../../collections/config/types';

export type Arguments = {
  collection: Collection
}

export type Result = {
  message: string,
  user: Document
}

async function registerFirstUser(this: Payload, args: Arguments): Promise<Result> {
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
  } = args;

  const count = await Model.countDocuments({});

  if (count >= 1) throw new Forbidden();

  // /////////////////////////////////////
  // Register first user
  // /////////////////////////////////////

  let result = await this.operations.collections.create({
    ...args,
    overrideAccess: true,
  });

  // auto-verify (if applicable)
  if (verify) {
    await this.operations.collections.update({
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

  const { token } = await this.operations.collections.auth.login({
    ...args,
  });

  result = {
    ...result,
    token,
  };

  return {
    message: 'Registered and logged in successfully. Welcome!',
    user: result,
  };
}

export default registerFirstUser;
