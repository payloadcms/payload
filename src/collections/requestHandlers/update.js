const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { update } = require('../queries');
const { NotFound } = require('../../errors');

const updateHandler = async (req, res) => {
  try {
    const doc = await update({
      model: req.model,
      config: req.collection,
      user: req.user,
      id: req.params.id,
      data: req.body,
    });

    if (!doc) return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));
  }
};

module.exports = updateHandler;
