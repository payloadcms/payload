const passport = require('passport');
const executePolicy = require('../executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');
const validateCreate = require('../../validation/validateCreate');

const register = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    if (!args.overridePolicy) {
      await executePolicy(args, args.collection.config.policies.create);
    }

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute field-level policies
    // /////////////////////////////////////

    // Field-level policies here

    // /////////////////////////////////////
    // 3. Validate incoming data
    // /////////////////////////////////////

    await validateCreate(args.data, args.collection.config.fields);

    // /////////////////////////////////////
    // 4. Execute before register field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(options, args.collection.config.fields, args.data, 'beforeCreate');

    // /////////////////////////////////////
    // 5. Execute before register hook
    // /////////////////////////////////////

    const { beforeRegister } = args.collection.config.hooks;

    if (typeof beforeRegister === 'function') {
      options = await beforeRegister(options);
    }

    // /////////////////////////////////////
    // 6. Perform register
    // /////////////////////////////////////

    const {
      collection: {
        Model,
      },
      data,
      req: {
        locale,
        fallbackLocale,
      },
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
    // 7. Execute after register hook
    // /////////////////////////////////////

    const afterRegister = args.collection.config.hooks;

    if (typeof afterRegister === 'function') {
      result = await afterRegister(options, result);
    }

    // /////////////////////////////////////
    // 8. Return user
    // /////////////////////////////////////

    return result.toJSON({ virtuals: true });
  } catch (error) {
    throw error;
  }
};

module.exports = register;
