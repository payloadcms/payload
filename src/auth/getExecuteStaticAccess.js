const executeStatic = require('./executeAccess');
const { Forbidden } = require('../errors');

const getExecuteStaticPolicy = ({ config, Model }) => async (req, res, next) => {
  try {
    if (req.path) {
      const policyResult = await executeStatic({ req, isReadingStaticFile: true }, config.access.read);

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

module.exports = getExecuteStaticPolicy;
