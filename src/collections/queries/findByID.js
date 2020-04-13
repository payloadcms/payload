const { Forbidden, NotFound } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const findByID = async (options) => {
  try {
    const {
      depth,
      locale,
      fallbackLocale,
      model,
      config,
      id,
      user,
    } = options;

    const policy = config && config.policies && config.policies.read;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      const mongooseOptions = {
        options: {},
      };

      if (depth && depth !== '0') {
        mongooseOptions.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        mongooseOptions.options.autopopulate = false;
      }

      // Await pre find hook here

      const result = await model.findOne({ _id: id }, {}, mongooseOptions);

      if (!result) throw new NotFound();

      if (locale && result.setLocale) {
        result.setLocale(locale, fallbackLocale);
      }

      // Await post find hook here

      return result.toJSON({ virtuals: true });
    }
    throw new Forbidden();
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
