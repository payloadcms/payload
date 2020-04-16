const register = require('./register');
const login = require('./login');
const { Forbidden } = require('../../errors');

const registerFirstUser = async (args) => {
  try {
    const count = await args.Model.countDocuments({});

    if (count >= 1) throw new Forbidden();

    // Await validation here

    let options = {
      Model: args.Model,
      config: args.config,
      api: args.api,
      data: args.data,
    };

    // /////////////////////////////////////
    // 1. Execute before register first user hook
    // /////////////////////////////////////

    const beforeRegisterHook = args.config.hooks && args.config.hooks.beforeFirstRegister;

    if (typeof beforeRegisterHook === 'function') {
      options = await beforeRegisterHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform register first user
    // /////////////////////////////////////

    let result = await register(options);

    // /////////////////////////////////////
    // 3. Execute after register hook
    // /////////////////////////////////////

    const afterRegisterHook = args.config.hooks && args.config.hooks.afterFirstRegister;

    if (typeof afterRegisterHook === 'function') {
      result = await afterRegisterHook(options, result);
    }

    // /////////////////////////////////////
    // 4. Return user
    // /////////////////////////////////////

    const token = await login(options);

    const results = {
      ...result,
      token,
    };

    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = registerFirstUser;
