const httpStatus = require('http-status');
const { NotFound } = require('../../errors');
const { destroy } = require('../queries');

const destroyHandler = async (req, res) => {
  try {
    const doc = await destroy({
      model: req.model,
      id: req.params.id,
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound());
    }

    return res.status(httpStatus.OK).send({ result: 'success' });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(err);
  }
};

module.exports = destroyHandler;
