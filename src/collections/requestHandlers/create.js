const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { create } = require('../operations');

const createHandler = async (req, res) => {
  try {
    const doc = await create({
      Model: req.Model,
      config: req.collection,
      user: req.user,
      data: req.body,
      locale: req.locale,
      api: 'REST',
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
