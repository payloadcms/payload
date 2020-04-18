const passport = require('passport');
const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');

const register = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args.user, args.config.policies.register);

    // Await validation here

    let options = {
      Model: args.Model,
      config: args.config,
      api: args.api,
      data: args.data,
      locale: args.locale,
      fallbackLocale: args.fallbackLocale,
    };

    // /////////////////////////////////////
    // 2. Execute before register field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(args.config.fields, args.data, 'beforeCreate');

    // /////////////////////////////////////
    // 3. Execute before register hook
    // /////////////////////////////////////

    const beforeRegisterHook = args.config.hooks && args.config.hooks.beforeRegister;

    if (typeof beforeRegisterHook === 'function') {
      options = await beforeRegisterHook(options);
    }

    // /////////////////////////////////////
    // 4. Perform register
    // /////////////////////////////////////

    const {
      Model,
      data,
      locale,
      fallbackLocale,
    } = options;

    const modelData = { ...data };
    delete modelData.password;

    const user = new Model();

    if (locale && user.setLocale) {
      user.setLocale(locale, fallbackLocale);
    }

    Object.assign(user, modelData);

    let result = await Model.register(user, data.password);

    await passport.authenticate('local');

    // /////////////////////////////////////
    // 5. Execute after register hook
    // /////////////////////////////////////

    const afterRegisterHook = args.config.hooks && args.config.hooks.afterRegister;

    if (typeof afterRegisterHook === 'function') {
      result = await afterRegisterHook(options, result);
    }

    // /////////////////////////////////////
    // 6. Return user
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = register;
