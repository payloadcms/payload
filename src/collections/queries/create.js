const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const create = async (options) => {
  try {
    const {
      model: Model,
      data,
      config,
      user,
      locale,
    } = options;

    const policy = config && config.policies && config.policies.create;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      // Await validation here

      // Await pre-hook here

      const doc = new Model();

      if (locale && doc.setLocale) {
        doc.setLocale(locale);
      }

      Object.assign(doc, data);
      await doc.save();

      // Await post hook here

      return doc.toJSON({ virtuals: true });
    }

    throw new Forbidden();
  } catch (err) {
    throw err;
  }
};

module.exports = create;
