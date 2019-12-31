import httpStatus from 'http-status';

const uploadMiddleware = (config, Upload) => {
  return (req, res, next) => {
    req.model = Upload;

    // set the req.model to the correct type of upload
    if (req.body.type) {
      if (config.uploads[req.body.type]) {
        req.uploadConfig = config.uploads[req.body.type];
        return next();
      }
      return res.status(httpStatus.BAD_REQUEST).send('Upload type is not recognized');
    }

    req.uploadConfig = {};
    return next();
  };
};

export default uploadMiddleware;
