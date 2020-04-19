const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const formatSuccessResponse = require('../../express/responses/formatSuccess');
const { update } = require('../operations');

const updateHandler = async (req, res) => {
  try {
    const user = await update({
      data: req.body,
      Model: req.Model,
      config: req.collection,
      id: req.params.id,
      api: 'REST',
      locale: req.locale,
      fallbackLocale: req.fallbackLocale,
      user: req.user,
    });

    return res.status(httpStatus.OK).json({
      ...formatSuccessResponse('Updated successfully.', 'message'),
      doc: user,
    });
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json(formatErrorResponse(error));
  }
};

module.exports = updateHandler;
