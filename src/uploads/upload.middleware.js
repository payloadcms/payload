import httpStatus from 'http-status';

const uploadMiddleware = (config, UploadModels) => {
  return (req, res, next) => {
    // set the req.model to the correct type of upload
    if (req.body.type) {
      if (config.uploads[req.body.type]) {
        req.uploadConfig = config.uploads[req.body.type];
        if (req.uploadConfig.imageSizes) {
          req.model = UploadModels.image;
        }
        return next();
      } else {
        return res.status(httpStatus.BAD_REQUEST).send('Upload type is not recognized');
      }
    }

    req.uploadConfig = {};
    req.model = UploadModels.default;
    next();
  };
};

export default uploadMiddleware;
