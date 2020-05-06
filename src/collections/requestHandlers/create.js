const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { create } = require('../operations');

const createHandler = async (req, res) => {
  try {
    const doc = await create({
      req,
      Model: req.collection.Model,
      config: req.collection.config,
      data: req.body,
    });

    return res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(`${req.collection.labels.singular} successfully created.`, 'message'),
      doc,
    });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = createHandler;
