const executePolicy = require('./executePolicy');
const { Forbidden } = require('../errors');

const getExecuteStaticPolicy = ({ config, Model }) => {
  return async (req, res, next) => {
    try {
      if (req.path) {
        const policyResult = await executePolicy({ req, isReadingStaticFile: true }, config.policies.read);

        if (typeof policyResult === 'object') {
          const filename = decodeURI(req.path).replace(/^\/|\/$/g, '');

          const queryToBuild = {
            where: {
              and: [
                {
                  filename: {
                    equals: filename,
                  },
                },
                policyResult,
              ],
            },
          };

          const query = await Model.buildQuery(queryToBuild, req.locale);
          const doc = await Model.findOne(query);

          if (!doc) {
            throw new Forbidden();
          }
        }
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = getExecuteStaticPolicy;
