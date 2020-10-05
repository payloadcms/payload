const { Forbidden } = require('../../errors');

async function registerFirstUser(args) {
  const {
    collection: {
      Model,
    },
  } = args;

  const count = await Model.countDocuments({});

  if (count >= 1) throw new Forbidden();

  // /////////////////////////////////////
  // 2. Perform register first user
  // /////////////////////////////////////

  let result = await this.operations.collections.create({
    ...args,
    overrideAccess: true,
  });


  // /////////////////////////////////////
  // 3. Log in new user
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

module.exports = registerFirstUser;
