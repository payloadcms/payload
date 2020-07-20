const httpStatus = require('http-status');

function findOne(globalConfig) {
  async function handler(req, res, next) {
    try {
      const { slug } = globalConfig;

      const result = await this.operations.globals.findOne({
        req,
        globalConfig,
        slug,
        depth: req.query.depth,
      });

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  const findOneHandler = handler.bind(this);

  return findOneHandler;
}

module.exports = findOne;
