const { registerFirstUser } = require('../operations');

const registerFirstUserHandler = config => async (req, res, next) => {
  try {
    const firstUser = await registerFirstUser({
      req,
      config,
      collection: req.collection,
      data: req.body,
    });

    return res.status(201).json(firstUser);
  } catch (error) {
    return next(error);
  }
};

module.exports = registerFirstUserHandler;
