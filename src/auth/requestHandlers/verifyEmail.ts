import httpStatus from 'http-status';

async function verifyEmail(req, res, next) {
  try {
    await this.operations.collections.auth.verifyEmail({
      collection: req.collection,
      token: req.params.token,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Email verified successfully.',
      });
  } catch (error) {
    return next(error);
  }
}

export default verifyEmail;
