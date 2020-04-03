const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { create } = require('../queries');

const createHandler = async (req, res) => {
  try {
    const doc = await create({
      Model: req.model,
      data: req.body,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(`${req.collection.labels.singular} successfully created.`, 'message'),
      doc,
    });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));
  }
};

module.exports = createHandler;
