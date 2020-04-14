const httpStatus = require('http-status');
const { NotFound } = require('../../errors');
const { deleteQuery } = require('../operations');

const deleteHandler = async (req, res) => {
  try {
    const doc = await deleteQuery({
      Model: req.Model,
      config: req.collection,
      user: req.user,
      id: req.params.id,
      locale: req.locale,
      fallbackLocale: req.fallbackLocale,
      api: 'REST',
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound());
    }

    return res.status(httpStatus.OK).send(doc);
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(err);
  }
};

module.exports = deleteHandler;
