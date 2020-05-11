const httpStatus = require('http-status');
const { NotFound } = require('../../errors');
const { deleteQuery } = require('../operations');

const deleteHandler = async (req, res, next) => {
  try {
    const doc = await deleteQuery({
      req,
      Model: req.collection.Model,
      config: req.collection.config,
      id: req.params.id,
    });

    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(new NotFound());
    }

    return res.status(httpStatus.OK).send(doc);
  } catch (error) {
    return next(error);
  }
};

module.exports = deleteHandler;
