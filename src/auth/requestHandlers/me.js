const { me } = require('../operations');

const meHandler = config => async (req, res, next) => {
  try {
    const response = await me({ req, config });
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
};

module.exports = meHandler;
