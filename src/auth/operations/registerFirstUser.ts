import { Forbidden } from '../../errors';

async function registerFirstUser(args) {
  const {
    collection: {
      Model,
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
