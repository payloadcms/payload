import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await this.operations.collections.auth.resetPassword({
      req,
      res,
      collection: req.collection,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Password reset successfully.',
        token: result.token,
        user: result.user,
      });
  } catch (error) {
    return next(error);
  }
}

export default resetPassword;
