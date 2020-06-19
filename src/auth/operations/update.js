
const { NotFound } = require('../../errors');
const executePolicy = require('../executePolicy');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.update);


    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before update hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Execute field-level hooks, policies, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

    // /////////////////////////////////////
    // 4. Perform update
    // /////////////////////////////////////

    const {
      Model,
      data,
      id,
      req: {
        locale,
        fallbackLocale,
      },
    } = options;

    const dataToUpdate = { ...data };
    const { password } = dataToUpdate;

    let user = await Model.findOne({ _id: id });

    if (!user) throw new NotFound();

    if (locale && user.setLocale) {
      user.setLocale(locale, fallbackLocale);
    }

    if (password) {
      delete dataToUpdate.password;
      await user.setPassword(password);
    }

    Object.assign(user, dataToUpdate);

    await user.save();

    user = user.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 5. Execute after update hook
    // /////////////////////////////////////

    const afterUpdateHook = args.config.hooks && args.config.hooks.afterUpdate;

    if (typeof afterUpdateHook === 'function') {
      user = await afterUpdateHook(options, user);
    }

    // /////////////////////////////////////
    // 6. Return user
    // /////////////////////////////////////

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = update;
