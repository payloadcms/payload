const executeAccess = require('./executeAccess');
const { Forbidden } = require('../errors');

const getExecuteStaticAccess = ({ config, Model }) => async (req, res, next) => {
  try {
    if (req.path) {
      const accessResult = await executeAccess({ req, isReadingStaticFile: true }, config.access.read);

      if (typeof accessResult === 'object') {
        const filename = decodeURI(req.path).replace(/^\/|\/$/g, '');

        const queryToBuild = {
          where: {
            and: [
              {
                filename: {
                  equals: filename,
                },
              },
              accessResult,
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

module.exports = getExecuteStaticAccess;
