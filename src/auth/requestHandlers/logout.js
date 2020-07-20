async function logoutHandler(req, res, next) {
  try {
    const message = await this.operations.collections.auth.logout({
      collection: req.collection,
      res,
      req,
    });

    return res.status(200).json({ message });
  } catch (error) {
    return next(error);
  }
}

module.exports = logoutHandler;
