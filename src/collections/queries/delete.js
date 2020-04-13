const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const deleteQuery = async (options) => {
  try {
    const {
      model,
      id,
      user,
      config,
    } = options;

    const policy = config && config.policies && config.policies.delete;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      // Await pre-hook here

      const result = await model.findOneAndDelete({ _id: id });
      return result.toJSON({ virtuals: true });
      // Await post hook here
    }
    throw new Forbidden();
  } catch (err) {
    throw err;
  }
};

module.exports = deleteQuery;
