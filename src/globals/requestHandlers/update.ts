import httpStatus from 'http-status';

function update(globalConfig) {
  async function handler(req, res, next) {
    try {
      const { slug } = globalConfig;

      const result = await this.operations.globals.update({
        req,
        globalConfig,
        slug,
        depth: req.query.depth,
        data: req.body,
      });

      return res.status(httpStatus.OK).json({ message: 'Global saved successfully.', result });
    } catch (error) {
      return next(error);
    }
  }

  const updateHandler = handler.bind(this);
  return updateHandler;
}

export default update;
