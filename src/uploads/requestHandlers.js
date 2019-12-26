import mkdirp from 'mkdirp';
import httpStatus from 'http-status';
import { resizeAndSave } from './images/imageResizer';
import modelById from '../mongoose/resolvers/modelById';
import { NotFound } from '../errors';

async function fileTypeHandler(config, uploadConfig, file) {
  const data = {};
  if (uploadConfig.imageSizes) {
    data.sizes = await resizeAndSave(config, uploadConfig, file);
  }

  return data;
}

const update = async (req, res, next, config) => {
  const query = {
    Model: req.model,
    id: req.params.id,
    locale: req.locale,
  };
  const doc = await modelById(query, { returnRawDoc: true });
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
  console.log(req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400)
      .send('No files were uploaded.');
    return;
  }

  mkdirp(config.staticDir, (err) => {
    if (err) {
      console.error(err);
      res.status(500)
        .json({ error: 'Upload failed.' });
    }
  });

  const outputFilepath = `${config.staticDir}/${req.files.file.name}`;
  const moveError = await req.files.file.mv(outputFilepath);
  if (moveError) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR)
      .send(moveError);
    return;
  }

  const handlerData = await fileTypeHandler(config, req.uploadConfig, req.files.file);

  req.model.create({
    filename: req.files.file.name,
    ...handlerData,
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

export { update, upload };
