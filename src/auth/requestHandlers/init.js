async function initHandler(req, res, next) {
  try {
    const initialized = await this.operations.collections.auth.init({ Model: req.collection.Model });
    return res.status(200).json({ initialized });
  } catch (error) {
    return next(error);
  }
}

module.exports = initHandler;
