const register = require('./register');
const login = require('./login');
const { Forbidden } = require('../../errors');

const registerFirstUser = async (args) => {
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

  let result = await register({
    ...args,
    overrideAccess: true,
  });


  // /////////////////////////////////////
  // 3. Log in new user
  // /////////////////////////////////////

  const token = await login({
    ...args,
  });

  result = {
    ...result,
    token,
  };

  return {
    message: 'Registered successfully. Welcome to Payload!',
    user: result,
  };
};

module.exports = registerFirstUser;
