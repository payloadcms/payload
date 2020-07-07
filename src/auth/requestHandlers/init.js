const { init } = require('../operations');

const initHandler = async (req, res, next) => {
  try {
    const initialized = await init({ Model: req.collection.Model });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
};

module.exports = initHandler;
