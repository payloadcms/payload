const httpStatus = require('http-status');
const { init } = require('../operations');
const formatError = require('../../express/responses/formatError');

const initHandler = async (req, res) => {
  try {
    const initialized = await init({ Model: req.Model });
    return res.status(200).json({ initialized });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatError(error));
  }
};

module.exports = initHandler;
