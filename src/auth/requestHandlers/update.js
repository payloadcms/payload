const httpStatus = require('http-status');
const formatSuccessResponse = require('../../express/responses/formatSuccess');

async function update(req, res, next) {
  try {
    const user = await this.operations.collections.auth.update({
      req,
      data: req.body,
      collection: req.collection,
      id: req.params.id,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = update;
