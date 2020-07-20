const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');

async function register(req, res, next) {
  try {
    const user = await this.operations.collections.auth.register({
      collection: req.collection,
      req,
      data: req.body,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(`${req.collection.config.labels.singular} successfully created.`, 'message'),
      doc: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = register;
