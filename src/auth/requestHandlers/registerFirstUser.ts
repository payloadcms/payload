async function registerFirstUser(req, res, next) {
  try {
    const firstUser = await this.operations.collections.auth.registerFirstUser({
      req,
      res,
      collection: req.collection,
      data: req.body,
    });

    return res.status(201).json(firstUser);
  } catch (error) {
    return next(error);
  }
}

export default registerFirstUser;
