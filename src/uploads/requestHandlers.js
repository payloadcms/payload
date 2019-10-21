import mkdirp from 'mkdirp';
import { resizeAndSave } from './images/imageResizer';
import httpStatus from 'http-status';
import modelById from '../mongoose/resolvers/modelById';

const update = async (req, res, next, config) => {
    const query = {
      Model: req.model,
      id: req.params.id,
      locale: req.locale,
    };
    let doc = await modelById(query, {returnRawDoc: true});
    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    if (req.files && req.files.file) {
      doc['filename'] = req.files.file.name;
      let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
      let moveError = await req.files.file.mv(outputFilepath);
      if (moveError) return res.status(500).send(moveError);
      let handlerData = await fileTypeHandler(config, req.uploadConfig, req.files.file);
      Object.keys(handlerData).forEach(e => {
        doc[e] = handlerData[e];
      });
    }

    doc.save((saveError) => {
      if (saveError)
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: saveError});

      return res.json({
        message: 'success',
        result: doc.toJSON({virtuals: true})
      });
    });
  };

const upload = async (req, res, next, config) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  mkdirp(config.staticDir, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Upload failed.');
    }
  });

  let outputFilepath = `${config.staticDir}/${req.files.file.name}`;
  let moveError = await req.files.file.mv(outputFilepath);
  if (moveError) return res.status(500).send(moveError);

  let handlerData = await fileTypeHandler(config, req.uploadConfig, req.files.file);

  req.model.create({
    filename: req.files.file.name,
    ...handlerData
  }, (mediaCreateError, result) => {
    if (mediaCreateError)
      return res.status(500).json({error: mediaCreateError});

    return res.status(201)
      .json({
        message: 'success',
        result: result.toJSON({virtuals: true})
      });
  });
};

async function fileTypeHandler(config, uploadConfig, file) {
  const data = {};
  if (uploadConfig.imageSizes) {
    data.sizes = await resizeAndSave(config, uploadConfig, file);
  }

  return data;
}

export {update, upload};
