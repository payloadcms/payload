const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { update } = require('../operations');

const updateHandler = async (req, res) => {
  try {
    const doc = await update({
      Model: req.Model,
      config: req.collection,
      user: req.user,
      id: req.params.id,
      data: req.body,
      locale: req.locale,
      api: 'REST',
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc,
    });
  } catch (error) {
    console.log(error); // TEMPORARY TO DEBUG JEST CI TESTS
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = updateHandler;
