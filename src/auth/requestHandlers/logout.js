const { logout } = require('../operations');

const logoutHandler = (config) => async (req, res, next) => {
  try {
    const message = await logout({
      config,
      collection: req.collection,
      res,
    });

    return res.status(200).json({ message });
  } catch (error) {
    return next(error);
  }
};

module.exports = logoutHandler;
