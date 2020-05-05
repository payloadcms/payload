const mkdirp = require('mkdirp');
const httpStatus = require('http-status');
const resizeAndSave = require('./images/imageResizer');
const findByID = require('../collections/operations/findByID');
const { NotFound } = require('../errors');
const { getFileSystemSafeFileName } = require('./utilities');

async function fileTypeHandler(config, uploadConfig, savedFilename) {
  const fileData = {};
  fileData.name = savedFilename;
  if (uploadConfig.imageSizes) {
    fileData.sizes = await resizeAndSave(config, uploadConfig, savedFilename);
  }
  return fileData;
}

const update = async (req, res, next, config) => {
  const query = {
    Model: req.Model,
    id: req.params.id,
    locale: req.locale,
  };
  const doc = await findByID(query, { returnRawDoc: true });
  if (!doc) {
    res.status(httpStatus.NOT_FOUND)
      .json(new NotFound());
    return;
  }

  if (req.files && req.files.file) {
    doc.filename = req.files.file.name;
    const outputFilepath = `${config.staticDir}/${req.files.file.name}`;
    const moveError = await req.files.file.mv(outputFilepath);
    if (moveError) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(moveError);
      return;
    }
    const handlerData = await fileTypeHandler(config, req.uploadConfig, req.files.file);
    Object.assign(doc, handlerData);
  }

  doc.save((saveError) => {
    if (saveError) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: saveError });
      return;
    }

    res.status(httpStatus.OK)
      .json({
        message: 'success',
        result: doc.toJSON({ virtuals: true }),
      });
  });
};

const upload = async (req, res, next, config) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(httpStatus.BAD_REQUEST)
      .json({ error: 'No files were uploaded.' });
    return;
  }

  mkdirp(config.staticDir, (err) => {
    if (err) {
      console.error(err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Upload failed.' });
    }
  });

  const fsSafeName = await getFileSystemSafeFileName(config.staticDir, req.files.file.name);
  const moveError = await req.files.file.mv(`${config.staticDir}/${fsSafeName}`);
  if (moveError) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR)
      .send(moveError);
    return;
  }

  const uploadData = await fileTypeHandler(config, req.uploadConfig, fsSafeName);

  req.Model.create({
    ...req.body,
    filename: uploadData.name,
    ...uploadData,
  }, (mediaCreateError, result) => {
    if (mediaCreateError) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: mediaCreateError });
    }

    return res.status(httpStatus.CREATED)
      .json({
        message: 'success',
        result: result.toJSON({ virtuals: true }),
      });
  });
};

module.exports = {
  update,
  upload,
};
