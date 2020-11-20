async function me(req, res, next) {
  try {
    const response = await this.operations.collections.auth.me({ req });
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
}

export default me;
