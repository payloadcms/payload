const register = require('./register');
const login = require('./login');
const { Forbidden } = require('../../errors');

const registerFirstUser = async (args) => {
  try {
    const count = await args.Model.countDocuments({});

    if (count >= 1) throw new Forbidden();

    // Await validation here

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before register first user hook
    // /////////////////////////////////////

    const { beforeRegister } = args.config.hooks;

    if (typeof beforeRegister === 'function') {
      options = await beforeRegister(options);
    }

    // /////////////////////////////////////
    // 2. Perform register first user
    // /////////////////////////////////////

    let result = await register({
      ...options,
      overridePolicy: true,
    });


    // /////////////////////////////////////
    // 3. Log in new user
    // /////////////////////////////////////

    const token = await login(options);

    result = {
      ...result,
      token,
    };

    // /////////////////////////////////////
    // 4. Execute after register first user hook
    // /////////////////////////////////////

    const afterRegister = args.config.hooks;

    if (typeof afterRegister === 'function') {
      result = await afterRegister(options, result);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = registerFirstUser;
