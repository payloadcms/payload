
const passport = require('passport');

const register = async (args) => {
  try {
    // Await validation here

    let options = {
      Model: args.Model,
      config: args.config,
      api: args.api,
      data: args.data,
    };

    // /////////////////////////////////////
    // 1. Execute before register hook
    // /////////////////////////////////////

    const beforeRegisterHook = args.config.hooks && args.config.hooks.beforeRegister;

    if (typeof beforeRegisterHook === 'function') {
      options = await beforeRegisterHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform register
    // /////////////////////////////////////

    const {
      Model,
      data,
    } = options;

    const modelData = { ...data };
    delete modelData.password;

    let result = await Model.register(new Model({
      ...modelData,
    }), data.password);

    await passport.authenticate('local');

    // /////////////////////////////////////
    // 3. Execute after register hook
    // /////////////////////////////////////

    const afterRegisterHook = args.config.hooks && args.config.hooks.afterRegister;

    if (typeof afterRegisterHook === 'function') {
      result = await afterRegisterHook(options, result);
    }

    // /////////////////////////////////////
    // 4. Return user
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = register;
