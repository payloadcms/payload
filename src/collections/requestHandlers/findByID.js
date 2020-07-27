async function findByID(req, res, next) {
  const options = {
    req,
    collection: req.collection,
    id: req.params.id,
    depth: req.query.depth,
  };

  try {
    const doc = await this.operations.collections.findByID(options);
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
}

module.exports = findByID;
